using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.IO;
using System.Xml;
using TextClassifierLib.Properties;
using System.Globalization;
using System.Windows.Forms;

namespace TextClassifierLib
{
	public class TextClassificator
	{
		#region Константы

		//константы нужны для обеспечения бОльшей производительности
		private const double MinimumWeightIncludeAtherGroupValue = 0.001;	//минимальное значение рейтинга с учётом других групп с которым можно учавствовыать для классификации
		private const double AdditionalWeight = 0.05;						//Величина на которую увеличивается вес слова при наличии его в списке слов по заданной тематике
		private const double AdditionalDictionaryWeight = 0.5;				//Величина на которую увеличивается вес слова при наличии его в тематическом словаре
		private const Int64 MinimumWordCount = 10;							//минимальное количество вхождений слова в группу
		private const Int64 MinimumWordLength = 4;							//минимальная длина слова

		public const string StopWordsFileName = "stopwords";
		public const string SeparatorsFileName = "separators";
		public const string LearnFolderName = "Resources/Learn/";

		#endregion

		#region Переменные

		TextClassificatorEntities _db = new TextClassificatorEntities();				//Коннект к базе
		public static TextClassificator Instance { get; set; }							//Singleton
		private static TextClassificator _learnedInstance { get; set; }					//Singleton
		private static Dictionary<string, TextClassificator> _learnedInstances { get; set; }

		private Dictionary<string, string> _groupsTexts;								//имя группы, все тексты в виде одной строки
		private Dictionary<string, Dictionary<string, Int64>> _wordsCountInGroups;		//имя группы, <слово, количество вхождений слова в группу>
		private Dictionary<string, Int64> _summaryWordsCountInGroup;					//имя группы, общее число слов в группе
		private Dictionary<string, Int64> _summaryWordsCountInGroupDistinct;			//имя группы, общее число слов в группе без повторений
		private Dictionary<string, Dictionary<string, double>> _wordsWeigthInGroups;	//имя группы, <слово, вес слова в группе без учёта других групп>
		private Dictionary<string, Dictionary<string, double>> _wordsWeigthsInGroupsIncludingOtherGroups;		//слово, <имя группы, вес слова в группе с учётом других групп> //так проще потом обрабатывать инфу
		private Dictionary<string, Dictionary<string, double>> _wordsWeigthsInGroupsIncludingOtherGroupsRemoved;//слово, <имя группы, вес слова в группе с учётом других групп> //тут список удалённых слов
		private Dictionary<string, List<string>> _stemOfWord;							//основа слова, список всех форм слова
		private Dictionary<string, List<string>> _themesOfWord;							//основа слова, список всех тем слова
		private Dictionary<string, Dictionary<string, double>> _lastStatisticsWeight;	//тема, слово, вес слова в рамках данной темы
		private Dictionary<string, Dictionary<string, Int64>> _lastStatisticsCount;		//тема, слово, количество попаданий слова в тему

		private Int64 _themeGroupId = 1;												//id группы тем в рамках которой происходит обучение

		#endregion

		#region Конструктор

		private void Init(List<string> separators, List<string> stopWords)
		{
			_separators = separators;
			_stopWords = stopWords;
		}

		public TextClassificator(List<string> separators, List<string> stopWords)
		{
			Init(separators, stopWords);
		}

		public TextClassificator()
		{

			var fs = (string)Resource.ResourceManager.GetObject(TextClassificator.SeparatorsFileName);
			var separators = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

			fs = (string)Resource.ResourceManager.GetObject(TextClassificator.StopWordsFileName);
			var stopWords = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

			Init(separators, stopWords);
		}

		/// <summary>создать обученный экземпляр классификатора (все значения берутся по умолчанию)
		/// </summary>
		/// <returns></returns>
		public static TextClassificator CreateLearnedInstance()
		{
			var separators = new List<string>();
			var fs = (string)Resource.ResourceManager.GetObject(TextClassificator.SeparatorsFileName);
			separators = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

			var stopWords = new List<string>();
			fs = (string)Resource.ResourceManager.GetObject(TextClassificator.StopWordsFileName);
			stopWords = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

			var instance = new TextClassificator(separators, stopWords);
			var themes = new Dictionary<string, string>();
			foreach (System.Collections.DictionaryEntry file in Resource.ResourceManager.GetResourceSet(new System.Globalization.CultureInfo("ru-RU"), true, true))
			{
				if (file.Key.ToString()[0] == '_')
				{
					var text = file.Value.ToString();
					text = text.ToLower();
					text = DeleteWords(text, separators, false);
					text = DeleteWords(text, stopWords);
					text = DeleteDoubleSpaceAndBadSymbols(text);
					themes.Add(file.Key.ToString().TrimStart('_'), text);
				}
			}
			using (var db = new TextClassificatorEntities())
			{
				instance.Learn(db.ThemeGroup.Single(tg => tg.ThemeGroup_id == 1).ThemeGroup_name, themes);
			}

			return instance;
		}

		public static TextClassificator CreateLearnedInstance(string themeGroupName)
		{
			if (_learnedInstances == null)
				_learnedInstances = new Dictionary<string, TextClassificator>();
			if (!_learnedInstances.ContainsKey(themeGroupName))
			{
				var separators = new List<string>();
				var fs = (string)Resource.ResourceManager.GetObject(TextClassificator.SeparatorsFileName);
				separators = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

				var stopWords = new List<string>();
				fs = (string)Resource.ResourceManager.GetObject(TextClassificator.StopWordsFileName);
				stopWords = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

				var instance = new TextClassificator(separators, stopWords);
				var themes = new Dictionary<string, string>();

				instance.Learn(themeGroupName, themes);
				_learnedInstances.Add(themeGroupName, instance);
			}

			return _learnedInstances[themeGroupName];
		}

		/// <summary>загрузка всех текстров группы
		/// </summary>
		/// <param name="filename">имя файл с текстами для обучения группы</param>
		/// <returns></returns>
		public static string LoadGroup(string filename)
		{
			var answer = new List<string>();
			try
			{
				var sr = new StreamReader(filename, Encoding.Default);
				while (!sr.EndOfStream)
					answer.Add(sr.ReadLine());

				sr.Close();
			}
			catch
			{
				return null;
			}
			return string.Join(" ", answer);
		}

		private static TextClassificator DefaultLoad()
		{
			var separators = new List<string>();
			var fs = (string)Resource.ResourceManager.GetObject(TextClassificator.SeparatorsFileName);
			separators = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

			var stopWords = new List<string>();
			fs = (string)Resource.ResourceManager.GetObject(TextClassificator.StopWordsFileName);
			stopWords = fs.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();

			var instance = new TextClassificator(separators, stopWords);
			var files = new List<System.Collections.DictionaryEntry>();
			var findString = "_export";
			foreach (System.Collections.DictionaryEntry file in Resource.ResourceManager.GetResourceSet(new System.Globalization.CultureInfo("ru-RU"), true, true))
				if (file.Key.ToString().Length >= findString.Length && file.Key.ToString().Substring(file.Key.ToString().Length - findString.Length, findString.Length) == findString)
					files.Add(file);
			var filesPath = files.ToDictionary(f => f.Key.ToString().Substring(0, f.Key.ToString().IndexOf('_')), f => Resource.ResourceManager.GetObject(f.Key.ToString()).ToString());
			instance.ImportFromXmlsString(filesPath);

			return instance;
		}
		public static TextClassificator LearnedInstance
		{
			get
			{
				if (_learnedInstance == null)
					_learnedInstance = DefaultLoad();
				return _learnedInstance;
			}
		}

		#endregion

		#region Приведение текста к нормальному виду

		#region Разделители и стоп слова

		private List<string> _stopWords;
		private List<string> _separators;

		private List<string> Separators
		{
			get
			{
				return _separators;
			}
		}

		private List<string> StopWords
		{
			get
			{
				return _stopWords;
			}
		}

		#endregion

		private static string DeleteDoubleSpaceAndBadSymbols(string text)
		{
			var regex = new Regex("[^a-zA-Zа-яА-Я]+");
			text = regex.Replace(text, " ");

			regex = new Regex("\\s+");
			text = regex.Replace(text, " ");
			text = text.Trim();
			return text;
		}
		private static string DeleteWords(string text, List<string> words, bool entireWord = true)
		{
			var space = entireWord ? " " : "";
			var newText = space + text + space;
			foreach (var word in words)
				newText = newText.Replace(space + word + space, " ");
			return newText.Trim();
		}

		/// <summary>Функция по приведению текста к нормальному виду (приведение к нижнему регистру, удаление стоп слов, разделителей, двойных пробелов)
		/// </summary>
		/// <param name="text">Исходный текст</param>
		/// <returns>Нормализованный текст</returns>
		public string NormilizeText(string text)
		{
			text = text.ToLower();
			text = DeleteWords(text, Separators, false);
			text = DeleteWords(text, StopWords);
			text = DeleteDoubleSpaceAndBadSymbols(text);
			return text;
		}

		/// <summary>Возвращает первое найденное полное слово с указананной основой
		/// </summary>
		/// <param name="stem">Овснова искомого слова</param>
		/// <example>Сепарат->Сепаратор</example>		
		/// <returns>Слово основа которого совпадает с указанной</returns>
		public string GetFirstFullText(string stem)
		{
			var word = _db.Word.SingleOrDefault(w => w.Word_name == stem);
			var answer = word.With(w => w.Allolog.FirstOrDefault().With(a => a.Allolog_name, stem), stem) ?? string.Empty;
			return answer;
		}

		#endregion

		#region Общие методы

		private List<string> Groups
		{
			get
			{
				return _groupsTexts.Keys.ToList();
			}
		}
		public List<string> ThemeGroups
		{
			get
			{
				using (var db = new TextClassificatorEntities())
				{
					return (from tg in db.ThemeGroup select tg.ThemeGroup_name).ToList();
				}
			}
		}
		public Int64 GetGroupThemeIdByGroupThemeName(string themeGroupName)
		{
			using (var db = new TextClassificatorEntities())
			{
				return db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
			}
		}

		/// <summary>Возвращает имя группы по caption согластно данным из базы
		/// </summary>
		public string GetGroupNameByCaption(string caption, Int64 themeGroupId)
		{
			return _db.Theme.SingleOrDefault(t => t.Theme_caption == caption && t.ThemeGroup_id == themeGroupId).With(t => t.Theme_name, caption);
		}

		/// <summary>Возвращает caption группы по имени
		/// </summary>
		public string GetGroupCaptionByName(string name, Int64 themeGroupId)
		{
			return _db.Theme.Single(t => t.Theme_name == name && t.ThemeGroup_id == themeGroupId).With(t => t.Theme_caption, name);
		}

		/// <summary>
		/// Получить статус слова в теме согластно базе
		/// </summary>
		public WordStatus GetWordStatus(string themeName, string stem)
		{
			var theme = _db.Theme.SingleOrDefault(t => t.Theme_name == themeName);
			var word = _db.Word.SingleOrDefault(w => w.Word_name == stem);

			if (theme == null)
			{
				theme = new Theme { Theme_name = themeName, Theme_caption = themeName, System_InsDT = DateTime.Now };
				_db.Theme.AddObject(theme);
				_db.SaveChanges();
			}

			if (word == null)
			{
				word = new Word { Word_name = stem, System_InsDT = DateTime.Now };
				_db.Word.AddObject(word);
				_db.SaveChanges();
			}

			theme = _db.Theme.Single(t => t.Theme_name == themeName);
			word = _db.Word.Single(w => w.Word_name == stem);

			if (_db.WordNotInTheme.Any(w => w.Word_id == word.Word_id && w.Theme_id == theme.Theme_id))
				return WordStatus.WordNotInTheme;
			if (_db.WordCandidatesInTheme.Any(w => w.Word_id == word.Word_id && w.Theme_id == theme.Theme_id && w.WordCandidatesInTheme_Visible == false))
				return WordStatus.WordAreIgnored;
			if (_db.WordInTheme.Any(w => w.Word_id == word.Word_id && w.Theme_id == theme.Theme_id && w.WordInTheme_isLexicalizedWord == true))
				return WordStatus.WordInThemeLexicalized;
			if (_db.WordInTheme.Any(w => w.Word_id == word.Word_id && w.Theme_id == theme.Theme_id && w.WordInTheme_isLexicalizedWord == false))
				return WordStatus.WordInTheme;
			return WordStatus.Other;
		}

		#endregion

		#region Обучение

		/// <summary>Функция которая оценивает твес слова применительно к группе без учёта влияния вхождения слова в другие группы
		/// функция сделана по образу и подобию (но модель по идее не совсем та, так что результат неизвестен) http://www.imdb.com/chart/top
		/// </summary>
		/// <param name="count">Количество вхождений слова в группу</param>
		/// <param name="wordCount">Общее число слов в группе без повторений</param>
		/// <param name="allCount">Общее число слов в группе</param>
		/// <returns>Итоговый вес слова в группе без учёта других групп</returns>
		private double Weight(Int64 count, Int64 wordCount, Int64 allCount)
		{
			var c = (double)allCount / wordCount;
			var r = (double)count / allCount;
			var m = (double)MinimumWordCount;
			var v = (double)count;

			return v / (v + m) * r /*+ m / (v + m) * c*/;
		}

		/// <summary>посчёт веса слова в группе с учётом вхождения этого слова в другие группы
		/// </summary>
		/// <param name="?">словарь вида <группа, вес слова в группе без учёта других групп> для текущего слова</param>
		/// <param name="groupCount">Общее количество групп</param>
		/// <returns>словарь вида <группа, вес слова в группе с учётом других групп> для текущего слова</returns>
		private Dictionary<string, double> WeightIncludedOtherGroup(Dictionary<string, double> weightInGroups, Int64 groupCount)
		{
			var sum = weightInGroups.Sum(wg => wg.Value);
			var sumPow = weightInGroups.Sum(wg => Math.Pow(wg.Value, 0.5));
			var answer = new Dictionary<string, double>();
			foreach (var wg in weightInGroups)
			{
				var finalWeight = wg.Value * (wg.Value / sum) - Math.Pow(sumPow - Math.Pow(wg.Value, 0.5), 2) / groupCount;	//итоговый вес = исходный вес * долю - (число которое предположительно будет большим для общих слов)
				//var finalWeight = wg.Value * (wg.Value / sum) - (sum - wg.Value) / groupCount;	//итоговый вес = исходный вес * долю - (число которое предположительно будет большим для общих слов)
				if (finalWeight >= MinimumWeightIncludeAtherGroupValue)
					answer.Add(wg.Key, finalWeight);
			}
			return answer;
		}

		/// <summary>Функция обучения (для дальнейшей классификации текстов по группам)
		/// </summary>
		/// <param name="groupsTexts">данные для обучения вида имя группы-текст принадлежащей группе</param>
		public void Learn(string themeGroupName, Dictionary<string, string> groupsTexts)
		{
			//обнуление предыдущего обучения
			var groupsTextsOld = groupsTexts;													//получение списка групп
			_groupsTexts = new Dictionary<string, string>();
			foreach (var g in groupsTexts)
				_groupsTexts.Add(g.Key, NormilizeText(g.Value));
			_wordsCountInGroups = new Dictionary<string, Dictionary<string, Int64>>();
			_summaryWordsCountInGroup = new Dictionary<string, Int64>();
			_summaryWordsCountInGroupDistinct = new Dictionary<string, Int64>();
			_wordsWeigthInGroups = new Dictionary<string, Dictionary<string, double>>();
			_wordsWeigthsInGroupsIncludingOtherGroups = new Dictionary<string, Dictionary<string, double>>();
			_wordsWeigthsInGroupsIncludingOtherGroupsRemoved = new Dictionary<string, Dictionary<string, double>>();
			_stemOfWord = new Dictionary<string, List<string>>();
			_themesOfWord = new Dictionary<string, List<string>>();
			//конец обнуления предыдущего обучения
			var stemming = new Stemming();					//класс для получения основы слова
			using (var db = new TextClassificatorEntities())
			{
				_themeGroupId = db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
				foreach (var text in _groupsTexts)
				{
					var words = text.Value.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);//.Select(w => stemming.Stem(w)).ToList();
					var wordsStem = new List<string>();
					foreach (var w in words)
					{
						var stem = stemming.Stem(w);
						if (!_stemOfWord.ContainsKey(stem))
							_stemOfWord.Add(stem, new List<string>());
						wordsStem.Add(stem);
						if (!_stemOfWord[stem].Contains(w))
							_stemOfWord[stem].Add(w);
					}
					wordsStem = wordsStem.Where(w => !string.IsNullOrWhiteSpace(w) && w.Length >= MinimumWordLength).ToList();
					wordsStem.RemoveAll(w => StopWords.Any(sw => sw == w));
					var groupWords = wordsStem.GroupBy(w => w);
					foreach (var w in groupWords)
					{
						if (!_themesOfWord.ContainsKey(w.Key))
							_themesOfWord.Add(w.Key, new List<string>());
						_themesOfWord[w.Key].Add(text.Key);
					}
					var dictionaryWords = (from gw in groupWords
										   where gw.Count() >= MinimumWordCount
										   select gw).ToDictionary(gw => gw.Key, gw => gw.LongCount());
					_summaryWordsCountInGroup.Add(text.Key, dictionaryWords.Sum(dw => dw.Value));
					_summaryWordsCountInGroupDistinct.Add(text.Key, dictionaryWords.LongCount());
					_wordsCountInGroups.Add(text.Key, dictionaryWords);
					Application.DoEvents();
				}

				foreach (var g in _wordsCountInGroups)
				{
					var temp = new Dictionary<string, double>();
					foreach (var w in g.Value)
					{
						temp.Add(w.Key, Weight(w.Value, _summaryWordsCountInGroup[g.Key], _summaryWordsCountInGroupDistinct[g.Key]));
					}
					_wordsWeigthInGroups.Add(g.Key, temp);
					Application.DoEvents();
				}

				//для простоты необходима перегруппировка, на верхнем уровне сейчас удобнее использовать слова, а не группы
				var wordsWeigthInGroupsTranspose = new Dictionary<string, Dictionary<string, double>>(); //слово,<имя группы, вес слова в группе>
				foreach (var wg in _wordsWeigthInGroups)
				{
					foreach (var w in wg.Value)
					{
						if (!wordsWeigthInGroupsTranspose.ContainsKey(w.Key))
							wordsWeigthInGroupsTranspose.Add(w.Key, new Dictionary<string, double>());
						wordsWeigthInGroupsTranspose[w.Key].Add(wg.Key, w.Value);
					}
					Application.DoEvents();
				}

				foreach (var w in wordsWeigthInGroupsTranspose)
					_wordsWeigthsInGroupsIncludingOtherGroups.Add(w.Key, WeightIncludedOtherGroup(w.Value, _groupsTexts.LongCount()));
				_wordsWeigthsInGroupsIncludingOtherGroups = _wordsWeigthsInGroupsIncludingOtherGroups.Where(w => w.Value.Count > 0).ToDictionary(w => w.Key, w => w.Value);


				//удаления у слов лишних групп				 
				foreach (var w in _wordsWeigthsInGroupsIncludingOtherGroups)
				{
					var delGroups =
						(
							from word in db.Word
							join wit in db.WordNotInTheme on word.Word_id equals wit.Word_id
							join g in db.Theme on wit.Theme_id equals g.Theme_id
							join gg in db.ThemeGroup on g.ThemeGroup_id equals gg.ThemeGroup_id
							where gg.ThemeGroup_id == _themeGroupId
							where word.Word_name == w.Key
							select g.Theme_name
						).ToList();
					foreach (var g in delGroups)
						if (w.Value.ContainsKey(g))
						{
							if (!_wordsWeigthsInGroupsIncludingOtherGroupsRemoved.ContainsKey(w.Key))
								_wordsWeigthsInGroupsIncludingOtherGroupsRemoved.Add(w.Key, new Dictionary<string, double>());
							_wordsWeigthsInGroupsIncludingOtherGroupsRemoved[w.Key].Add(g, w.Value[g]);
							w.Value.Remove(g);
						}
					Application.DoEvents();
				}

				var addWordGroup =
					(
						from w in db.Word
						join wig in db.WordInTheme on w.Word_id equals wig.Word_id
						join g in db.Theme on wig.Theme_id equals g.Theme_id
						join gg in db.ThemeGroup on g.ThemeGroup_id equals gg.ThemeGroup_id
						where gg.ThemeGroup_id == _themeGroupId
						select new { id = w.Word_id, name = w.Word_name, theme = g.Theme_name, isLexicalizedWord = wig.WordInTheme_isLexicalizedWord }
					);

				foreach (var wg in addWordGroup)
				{
					if (!_themesOfWord.ContainsKey(wg.name))
						_themesOfWord.Add(wg.name, new List<string>());
					if (!_themesOfWord[wg.name].Contains(wg.theme))
						_themesOfWord[wg.name].Add(wg.theme);
					if (!_groupsTexts.ContainsKey(wg.theme))
						_groupsTexts.Add(wg.theme, string.Empty);
					if (!_wordsWeigthsInGroupsIncludingOtherGroups.ContainsKey(wg.name))
						_wordsWeigthsInGroupsIncludingOtherGroups.Add(wg.name, new Dictionary<string, double>());
					var addWeight = wg.isLexicalizedWord ? AdditionalDictionaryWeight : AdditionalWeight;
					if (!_wordsWeigthsInGroupsIncludingOtherGroups[wg.name].ContainsKey(wg.theme))
						_wordsWeigthsInGroupsIncludingOtherGroups[wg.name].Add(wg.theme, 0);
					_wordsWeigthsInGroupsIncludingOtherGroups[wg.name][wg.theme] += addWeight;

					if (!_stemOfWord.ContainsKey(wg.name))
						_stemOfWord.Add(wg.name, new List<string>());
					var allolog = db.Allolog.FirstOrDefault(a => a.Word_id == wg.id);
					var allolog_name = allolog.With(a => a.Allolog_name, wg.name);
					if (!_stemOfWord[wg.name].Contains(allolog_name))
						_stemOfWord[wg.name].Add(allolog_name);
					Application.DoEvents();
				}
				Application.DoEvents();
			}

			_wordsCountInGroups = new Dictionary<string, Dictionary<string, Int64>>();
			_summaryWordsCountInGroup = new Dictionary<string, Int64>();
			_summaryWordsCountInGroupDistinct = new Dictionary<string, Int64>();
			_wordsWeigthInGroups = new Dictionary<string, Dictionary<string, double>>();
			_wordsWeigthsInGroupsIncludingOtherGroupsRemoved = new Dictionary<string, Dictionary<string, double>>();

			GC.Collect();

		}

		#endregion

		#region Тест

		/// <summary>Функция классификации текста
		/// </summary>
		/// <param name="text">Текст который необходимо классифийировать</param>		
		/// <returns>Данные вида имя группы , степень принадлежность текста группе</returns>
		public Dictionary<string, double> Check(string text)
		{
			if (_wordsWeigthsInGroupsIncludingOtherGroups == null)
				return null;
			var lastStatisticsWeightGlobal = new Dictionary<string, Dictionary<string, double>>();
			var lastStatisticsCountGlobal = new Dictionary<string, Dictionary<string, Int64>>();
			var answer = new Dictionary<string, double>();
			text = text.Replace(Environment.NewLine, " ");
			text = NormilizeText(text);

			var stemming = new Stemming();					//класс для получения основы слова

			var words = text.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).Select(w => stemming.Stem(w));
			words = words.Where(w => !string.IsNullOrWhiteSpace(w) && w.Length >= MinimumWordLength);

			foreach (var group in _groupsTexts)
				answer.Add(group.Key, 0);

			foreach (var word in words)
			{
				if (_wordsWeigthsInGroupsIncludingOtherGroups.ContainsKey(word))
					foreach (var group in _wordsWeigthsInGroupsIncludingOtherGroups[word])
					{
						if (!lastStatisticsWeightGlobal.ContainsKey(group.Key))
						{
							lastStatisticsWeightGlobal.Add(group.Key, new Dictionary<string, double>());
							lastStatisticsCountGlobal.Add(group.Key, new Dictionary<string, long>());
						}
						if (!lastStatisticsWeightGlobal[group.Key].ContainsKey(word))
						{
							lastStatisticsWeightGlobal[group.Key].Add(word, group.Value);
							lastStatisticsCountGlobal[group.Key].Add(word, 0);
						}
						answer[group.Key] += group.Value;
						lastStatisticsCountGlobal[group.Key][word]++;
					}
			}

			var orderAnswer = new Dictionary<string, double>();

			//сортировка в обратном порядке, не охото компарер писать ради такой фигни
			var values = answer.Values.Select(v => -v).ToList();
			values.Sort();
			values = values.Distinct().Select(v => -v).ToList();
			foreach (var value in values)
			{
				var orderStep = answer.Where(a => a.Value == value);
				foreach (var answerElement in orderStep)
					orderAnswer.Add(answerElement.Key, answerElement.Value);
			}
			//конец сортировки в обратном порядке

			var lastStatisticsWeight = new Dictionary<string, Dictionary<string, double>>();
			var lastStatisticsCount = new Dictionary<string, Dictionary<string, Int64>>();

			foreach (var ans in orderAnswer)
			{
				if (lastStatisticsWeightGlobal.ContainsKey(ans.Key))
				{
					lastStatisticsWeight.Add(ans.Key, lastStatisticsWeightGlobal[ans.Key]);
					lastStatisticsCount.Add(ans.Key, lastStatisticsCountGlobal[ans.Key]);
				}
			}

			_lastStatisticsWeight = lastStatisticsWeight;
			_lastStatisticsCount = lastStatisticsCount;

			return orderAnswer;
		}

		/// <summary>тема, слово, вес, количество вхождений слова в тему
		/// </summary>
		public Dictionary<string, Dictionary<string, Tuple<double, Int64>>> GetLastStatistics
		{
			get
			{
				if (_lastStatisticsWeight == null)
					throw new ArgumentNullException("Функция классификации текста ещё ни разу не запускалась");
				var answer = new Dictionary<string, Dictionary<string, Tuple<double, Int64>>>();
				foreach (var w in _lastStatisticsWeight)
				{
					answer.Add(w.Key, new Dictionary<string, Tuple<double, long>>());
					foreach (var word in w.Value)
						answer[w.Key].Add(word.Key, new Tuple<double, long>(_lastStatisticsWeight[w.Key][word.Key], _lastStatisticsCount[w.Key][word.Key]));
				}
				return answer;
			}
		}

		#endregion

		#region Export & Import

		/// <summary>сформировать xml файл (по идее метод устарел, но он может быть использован чтобы сохранить результат обучения) 
		/// </summary>
		/// <param name="filename">Имя корневой папки для сохранения всего обучения</param>
		/// <param name="saveAllAllologs">Сохранение списка всех словоформ у каждого слова</param>
		public void ExportToFolder(string filename, bool saveAllAllologs = true)
		{
			if (Directory.Exists(filename))
				Directory.Delete(filename);
			Directory.CreateDirectory(filename);
			System.Threading.Thread.CurrentThread.CurrentCulture = CultureInfo.GetCultureInfo("ru-RU");
			foreach (var group in Groups)
			{
				var sw = new StreamWriter(string.Format(filename + @"/{0}.txt", group), false, Encoding.UTF8);
				sw.WriteLine("<Words>");

				foreach (var w in _themesOfWord.Where(tw => tw.Value.Contains(group)))
				{
					if (!_wordsWeigthsInGroupsIncludingOtherGroups.ContainsKey(w.Key) || !_wordsWeigthsInGroupsIncludingOtherGroups[w.Key].ContainsKey(group))
						continue;
					sw.WriteLine();
					sw.WriteLine(string.Format("<Word Stem=\"{0}\" Weight=\"{1}\">", w.Key, _wordsWeigthsInGroupsIncludingOtherGroups[w.Key][group].ToString().Replace(',', '.')));
					if (saveAllAllologs)
						foreach (var allogs in _stemOfWord[w.Key])
							sw.WriteLine(string.Format("<Allolog Form=\"{0}\"/>", allogs));
					sw.WriteLine("</Word>");
				}

				sw.WriteLine();
				sw.WriteLine("</Words>");
				sw.Close();
			}
		}

		/// <summary>экспорт результатов текущего обучения в базу (без учёта весов) для дальнейшей ручной группировки слов
		/// </summary>
		public void ExportToDataBase(string themeGroupName)
		{
			using (var db = new TextClassificatorEntities())
			{
				_themeGroupId = db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
				var newGroups = Groups.Except(db.Theme.Where(th => th.ThemeGroup_id == _themeGroupId).Select(th => th.Theme_name)).Select(th => new Theme { ThemeGroup_id = _themeGroupId, Theme_name = th, Theme_caption = th, System_InsDT = DateTime.Now }).ToList();
				newGroups.ToList().ForEach(th => db.Theme.AddObject(th));
				db.SaveChanges();

				var newWords = _wordsWeigthsInGroupsIncludingOtherGroups.Keys.Except(db.Word.Select(w => w.Word_name)).Select(w => new Word { Word_name = w, System_InsDT = DateTime.Now }).ToList();
				newWords.ToList().ForEach(w => db.Word.AddObject(w));
				db.SaveChanges();

				foreach (var allWord in _wordsWeigthsInGroupsIncludingOtherGroups.Select(w => w.Key))
				{
					var stem = _stemOfWord[allWord];
					var word = db.Word.Single(w => w.Word_name == allWord);
					var currentAllologs = db.Allolog.Where(a => a.Word_id == word.Word_id);
					var newAllogs = stem.Except(currentAllologs.Select(a => a.Allolog_name)).Select(a => new Allolog { Allolog_name = a, Word_id = word.Word_id, System_InsDT = DateTime.Now }).ToList();
					newAllogs.ForEach(a => db.Allolog.AddObject(a));
					db.SaveChanges();
				}

				foreach (var theme in Groups)
				{
					var words = new List<string>();
					words.AddRange
						(
							from gr in db.Theme
							join wc in db.WordCandidatesInTheme on gr.Theme_id equals wc.Theme_id
							join w in db.Word on wc.Word_id equals w.Word_id
							where gr.Theme_name == theme
							where gr.ThemeGroup_id == _themeGroupId
							select w.Word_name
						);
					words.AddRange
						(
							from gr in db.Theme
							join wc in db.WordInTheme on gr.Theme_id equals wc.Theme_id
							join w in db.Word on wc.Word_id equals w.Word_id
							where gr.Theme_name == theme
							where gr.ThemeGroup_id == _themeGroupId
							select w.Word_name
						);
					words.AddRange
						(
							from gr in db.Theme
							join wc in db.WordNotInTheme on gr.Theme_id equals wc.Theme_id
							join w in db.Word on wc.Word_id equals w.Word_id
							where gr.Theme_name == theme
							where gr.ThemeGroup_id == _themeGroupId
							select w.Word_name
						);
					words = words.Distinct().ToList();
					var wordsInGroup = _wordsWeigthsInGroupsIncludingOtherGroups.Where(w => w.Value.Any(gr => gr.Key == theme)).Select(w => w.Key);
					var newWordsInGroup = wordsInGroup.Except(words);
					var group = db.Theme.Single(th => th.Theme_name == theme && th.ThemeGroup_id == _themeGroupId);
					foreach (var newWordInGroup in newWordsInGroup)
					{
						var word = db.Word.Single(w => w.Word_name == newWordInGroup);
						db.WordCandidatesInTheme.AddObject(new WordCandidatesInTheme { Word_id = word.Word_id, Theme_id = group.Theme_id, System_InsDT = DateTime.Now, WordCandidatesInTheme_Visible = true });
					}
					db.SaveChanges();
				}
			}
		}

		/// <summary>импорт из файла всего результата обчучения
		/// </summary>
		/// <param name="filenames">Список файлов имя файлов = имя темы + разширение</param>
		/// <returns>Список импортированных групп</returns>
		public List<string> Import(IEnumerable<string> filenames)
		{
			var xmlsString = new Dictionary<string, string>();
			foreach (var filename in filenames)
			{
				var sr = new StreamReader(filename);
				xmlsString.Add(Path.GetFileName(filename), sr.ReadToEnd());
				sr.Close();
			}
			return _groupsTexts.Keys.ToList();
		}

		public List<string> ImportFromXmlsString(IDictionary<string, string> xmlsString)
		{
			_groupsTexts = new Dictionary<string, string>();
			_wordsWeigthsInGroupsIncludingOtherGroups = new Dictionary<string, Dictionary<string, double>>();
			foreach (var xmlString in xmlsString)
			{
				var xDoc = new XmlDocument();
				xDoc.LoadXml(xmlString.Value);
				var groupName = Path.GetFileNameWithoutExtension(xmlString.Key);
				_groupsTexts.Add(groupName, null);
				foreach (XmlElement node in xDoc.ChildNodes.Cast<XmlElement>().Single().ChildNodes)
				{
					var word = node.Attributes["Stem"].Value;
					System.Threading.Thread.CurrentThread.CurrentCulture = CultureInfo.GetCultureInfo("ru-RU");
					var weight = double.Parse(node.Attributes["Weight"].Value.Replace(".", ","));
					if (!_wordsWeigthsInGroupsIncludingOtherGroups.ContainsKey(word))
						_wordsWeigthsInGroupsIncludingOtherGroups.Add(word, new Dictionary<string, double>());
					_wordsWeigthsInGroupsIncludingOtherGroups[word].Add(groupName, weight);
				}
			}
			return _groupsTexts.Keys.ToList();
		}
		public void LoadLexicalizedWords(string themeGroup, string theme, List<string> words)
		{
			words = words.Distinct().ToList();
			words = words.Where(w => !string.IsNullOrWhiteSpace(w)).ToList();
			words = words.Select(w => NormilizeText(w)).ToList();
			using (var db = new TextClassificatorEntities())
			{
				_themeGroupId = db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroup).ThemeGroup_id;
				if (!db.Theme.Any(th => th.Theme_name == theme))
				{
					db.Theme.AddObject(new Theme { ThemeGroup_id = _themeGroupId, Theme_name = theme, Theme_caption = theme, System_InsDT = DateTime.Now });
					db.SaveChanges();
				}

				var themeObj = db.Theme.Single(th => th.Theme_name == theme && th.ThemeGroup_id == _themeGroupId);

				var newWords = words.Except(db.Word.Select(w => w.Word_name)).Select(w => new Word { Word_name = w, System_InsDT = DateTime.Now }).ToList();
				newWords.ToList().ForEach(w => db.Word.AddObject(w));
				db.SaveChanges();
				foreach (var word in words)
				{
					var wordObj = db.Word.Single(w => w.Word_name == word);
					if (db.WordNotInTheme.Any(w => w.Theme_id == themeObj.Theme_id && w.Word_id == wordObj.Word_id))
						continue;

					var wc = db.WordCandidatesInTheme.SingleOrDefault(w => w.Theme_id == themeObj.Theme_id && w.Word_id == wordObj.Word_id);
					if (wc != null)
					{
						db.WordCandidatesInTheme.DeleteObject(wc);
						db.SaveChanges();

					}

					var wt = db.WordInTheme.SingleOrDefault(w => w.Theme_id == themeObj.Theme_id && w.Word_id == wordObj.Word_id);
					if (wt != null)
					{
						db.WordInTheme.DeleteObject(wt);
						db.SaveChanges();
					}
					db.WordInTheme.AddObject(new WordInTheme { Word_id = wordObj.Word_id, Theme_id = themeObj.Theme_id, WordInTheme_isLexicalizedWord = true, System_InsDT = DateTime.Now });
					db.SaveChanges();
				}
			}
		}

		#endregion

		#region Правка

		/// <summary>Удалить слово из темы
		/// <example>DeleteWord("it", "Сухарики")</example>
		/// </summary>
		/// <returns>Вес слова в данной теме после изменения списка</returns>
		public double DeleteWord(string themeGroupName, string themeName, string stem)
		{
			var wordIdx = MergeWord(stem);
			_themeGroupId = _db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
			var theme = _db.Theme.Single(t => t.Theme_name == themeName && t.ThemeGroup_id == _themeGroupId);
			DeleteWordFromAllList(themeGroupName, themeName, stem);
			var wnit = new WordNotInTheme { Word_id = wordIdx, Theme_id = theme.Theme_id, System_InsDT = DateTime.Now };
			_db.WordNotInTheme.AddObject(wnit);
			_db.SaveChanges();
			if (!_wordsWeigthsInGroupsIncludingOtherGroupsRemoved.ContainsKey(stem))
				_wordsWeigthsInGroupsIncludingOtherGroupsRemoved.Add(stem, new Dictionary<string, double>());
			_wordsWeigthsInGroupsIncludingOtherGroupsRemoved[stem].Add(themeName, _wordsWeigthsInGroupsIncludingOtherGroups[stem][themeName]);
			_wordsWeigthsInGroupsIncludingOtherGroups[stem].Remove(themeName);
			return 0.0;
		}

		/// <summary>Слово не будет иметь повышенный вес в рамках данной темы
		/// <example>IgnoreWord("it", "Блок") //мб системный блок, хотя хз</example>
		/// </summary>
		/// <returns>Вес слова в данной теме после изменения списка</returns>
		public double IgnoreWord(string themeGroupName, string themeName, string stem)
		{
			var wordIdx = MergeWord(stem);
			_themeGroupId = _db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
			var theme = _db.Theme.Single(t => t.Theme_name == themeName && t.ThemeGroup_id == _themeGroupId);
			DeleteWordFromAllList(themeGroupName, themeName, stem);
			var wordCandidate = new WordCandidatesInTheme { Word_id = wordIdx, Theme_id = theme.Theme_id, System_InsDT = DateTime.Now, WordCandidatesInTheme_Visible = false };
			_db.WordCandidatesInTheme.AddObject(wordCandidate);
			_db.SaveChanges();
			return _wordsWeigthsInGroupsIncludingOtherGroups[stem][themeName];
		}

		/// <summary>Слово относится к теме
		/// <example>AddWord("it", "Код")</example>
		/// </summary>
		/// <returns>Вес слова в данной теме после изменения списка</returns>
		public double AddWord(string themeGroupName, string themeName, string stem)
		{
			return AddWord(themeGroupName, themeName, stem, false);
		}

		/// <summary>Слово относится ТОЛЬКО к данной теме
		/// <example>AddWord("it", "Программирование")</example>
		/// </summary>
		/// <returns>Вес слова в данной теме после изменения списка</returns>
		public double AddLexicalizedWord(string themeGroupName, string themeName, string stem)
		{
			return AddWord(themeGroupName, themeName, stem, true);
		}

		/// <summary>Вставка слова в список слов относящихся к теме
		/// </summary>
		/// <param name="lexicalizedWord">Является ли слово словарным</param>
		/// <returns>Вес слова в данной теме после изменения списка</returns>
		private double AddWord(string themeGroupName, string themeName, string stem, bool lexicalizedWord)
		{
			var wordIdx = MergeWord(stem);
			_themeGroupId = _db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
			var theme = _db.Theme.Single(t => t.Theme_name == themeName && t.ThemeGroup_id == _themeGroupId);
			DeleteWordFromAllList(themeGroupName, themeName, stem);
			var wordInTheme = new WordInTheme
			{
				Word_id = wordIdx,
				WordInTheme_isLexicalizedWord = lexicalizedWord,
				System_InsDT = DateTime.Now,
				Theme_id = theme.Theme_id
			};
			_db.WordInTheme.AddObject(wordInTheme);
			_db.SaveChanges();
			_wordsWeigthsInGroupsIncludingOtherGroups[stem][themeName] += lexicalizedWord ? AdditionalDictionaryWeight : AdditionalWeight;
			return _wordsWeigthsInGroupsIncludingOtherGroups[stem][themeName];
		}

		/// <summary>Merge слова в таблицу
		/// </summary>
		private Int64 MergeWord(string stem)
		{
			if (!_db.Word.Any(w => w.Word_name == stem))
			{
				var newWord = new Word
				{
					Word_name = stem,
					System_InsDT = DateTime.Now
				};
				_db.Word.AddObject(newWord);
				_db.SaveChanges();
			}
			return _db.Word.Single(w => w.Word_name == stem).Word_id;
		}

		private void DeleteWordFromAllList(string themeGroupName, string themeName, string stem)
		{
			var wordIdx = MergeWord(stem);
			_themeGroupId = _db.ThemeGroup.Single(tg => tg.ThemeGroup_name == themeGroupName).ThemeGroup_id;
			var theme = _db.Theme.Single(t => t.Theme_name == themeName && t.ThemeGroup_id == _themeGroupId);
			if (_db.WordInTheme.Any(w => w.Word_id == wordIdx && w.Theme_id == theme.Theme_id))
			{
				var wit = _db.WordInTheme.Single(w => w.Word_id == wordIdx && w.Theme_id == theme.Theme_id);
				_wordsWeigthsInGroupsIncludingOtherGroups[stem][themeName] -= wit.WordInTheme_isLexicalizedWord ? AdditionalDictionaryWeight : AdditionalWeight;
				_db.WordInTheme.DeleteObject(wit);
				_db.SaveChanges();
			}
			if (_db.WordNotInTheme.Any(w => w.Word_id == wordIdx && w.Theme_id == theme.Theme_id))
			{
				var wordNotInTheme = _db.WordNotInTheme.Single(w => w.Word_id == wordIdx && w.Theme_id == theme.Theme_id);
				_db.DeleteObject(wordNotInTheme);
				_db.SaveChanges();
				if (!_wordsWeigthsInGroupsIncludingOtherGroups.ContainsKey(stem))
					_wordsWeigthsInGroupsIncludingOtherGroups.Add(stem, new Dictionary<string, double>());
				_wordsWeigthsInGroupsIncludingOtherGroups[stem].Add(themeName, _wordsWeigthsInGroupsIncludingOtherGroupsRemoved[stem][themeName]);
				_wordsWeigthsInGroupsIncludingOtherGroupsRemoved[stem].Remove(themeName);
			}
			if (_db.WordCandidatesInTheme.Any(w => w.Word_id == wordIdx && w.Theme_id == theme.Theme_id))
			{
				var wordCandidatesInTheme = _db.WordCandidatesInTheme.Single(w => w.Word_id == wordIdx && w.Theme_id == theme.Theme_id);
				_db.WordCandidatesInTheme.DeleteObject(wordCandidatesInTheme);
			}
		}

		#endregion
	}
}
