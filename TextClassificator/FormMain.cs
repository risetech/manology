using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.IO;
using System.Globalization;
using TextClassifierLib.Properties;

namespace TextClassifierLib
{
	public partial class FormMain : Form
	{

		#region Константы

		private const string DefaultFilenameOfGroup1 = @"C:\Users\syutkin\Documents\Visual Studio 2010\Projects\TextClassificator\TextClassificator\bin\Debug\group1.txt";
		private const string DefaultFilenameOfGroup2 = @"C:\Users\syutkin\Documents\Visual Studio 2010\Projects\TextClassificator\TextClassificator\bin\Debug\group2.txt";

		private TextClassificator _tc;

		#endregion

		#region Переменные

		private DataGridView _dgvContextClick;		//запоминаем грид в котрорый кликнули (контекстное меню)
		private Dictionary<string, string> _groups;	//caption, имя группы

		#endregion

		#region Конструктор + обработчики

		public FormMain()
		{
			InitializeComponent();
			//_tc = TextClassificator.CreateLearnedInstance();
			System.Threading.Thread.CurrentThread.CurrentCulture = new CultureInfo("ru-RU");
			_tc = TextClassificator.LearnedInstance;
		}

		private void FormMain_Load(object sender, EventArgs e)
		{
			comboBoxThemeGroup.DataSource = _tc.ThemeGroups;
		}
		private void dataGridViewGroups_CellContentClick(object sender, DataGridViewCellEventArgs e)
		{
			if (dataGridViewGroups.Columns[e.ColumnIndex].Name == "ColumnChange")
				SetFileName(dataGridViewGroups.Rows[e.RowIndex]);
		}
		private void buttonLearn_Click(object sender, EventArgs e)
		{			
			//if (MessageBox.Show("Обучить систему по умолчанию?", "Вопроооос", MessageBoxButtons.YesNo) == System.Windows.Forms.DialogResult.No)
				_tc.Learn(comboBoxThemeGroup.Text, GetGroups());
			//else
			//	_tc = TextClassificator.CreateLearnedInstance();
		}
		private void richTextBoxMainText_TextChanged(object sender, EventArgs e)
		{
			var separators = Resources.Separators.Split(new char[] { '\n' }, StringSplitOptions.RemoveEmptyEntries).ToList();
			separators.Add("\n");
			textBox1.Text = richTextBoxMainText.Text.Split(separators.ToArray(), StringSplitOptions.RemoveEmptyEntries).Count().ToString();
		}

		#region Вкладка с объяснением

		/// <summary>Установить текст заголовка у tabPage относящейся к заданной теме
		/// </summary>
		/// <param name="themeName">Тема к которой относится tabPage</param>
		/// <param name="tabPage">Сам tabPage</param>
		/// <param name="grid">DataGridView с данными о текущих весах</param>
		private void SetTabPageCaption(string themeName, TabPage tabPage, DataGridView grid)
		{
			var sum = grid.Rows.Cast<DataGridViewRow>().Sum(row => double.Parse(row.Cells["Sum"].Value.ToString()));
			tabPage.Text = _tc.GetGroupCaptionByName(themeName, _tc.GetGroupThemeIdByGroupThemeName(comboBoxThemeGroup.Text)) + '/' + sum;
		}

		/// <summary>Происходит при изменении значения ячейки грида с весами
		/// </summary>
		void dgv_CellValueChanged(object sender, DataGridViewCellEventArgs e)
		{
			var dgv = sender as DataGridView;
			if (dgv.Columns[e.ColumnIndex].Name == "Sum")
			{
				var themeName = (dgv.Parent as TabPage).Tag.ToString();
				var stem = dgv.Rows[e.RowIndex].Cells["Stem"].Value.ToString();
				SetTabPageCaption(themeName, dgv.Parent as TabPage, dgv);
				dgv.Rows[e.RowIndex].Cells["Status"].Value = WordStatusText.GetText(_tc.GetWordStatus(themeName, stem));
			}
		}

		private void OnChangeStatus(object sender, EventArgs e)
		{
			var themeName = CurrentTheme;
			var stem = CurrentWord;
			_dgvContextClick.SelectedRows.Cast<DataGridViewRow>().Single().Cells["Status"].Value = WordStatusText.GetText(_tc.GetWordStatus(themeName, stem));

		}

		/// <summary>Создать вкладку со статистикой по заданной теме
		/// </summary>
		/// <param name="themeName">тема вкладки</param>
		/// <param name="weights">слово, вес слова в теме, количество слов в тексте</param>
		private void SetThemeStatistics(string themeName, Dictionary<string, Tuple<double, Int64>> weights)
		{
			var tp = new TabPage { Tag = themeName };
			var dgv = new DataGridView
				{
					Dock = DockStyle.Fill,
					AllowUserToAddRows = false,
					AllowUserToDeleteRows = false,
					AllowUserToOrderColumns = false,
					AllowUserToResizeColumns = false,
					AllowDrop = false,
					AllowUserToResizeRows = false,
					MultiSelect = false
				};
			tp.Controls.Add(dgv);
			tabControlThemes.TabPages.Add(tp);

			dgv.Columns.Add(new DataGridViewTextBoxColumn { Name = "FullText", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, HeaderText = "Слово", ReadOnly = true });
			dgv.Columns.Add(new DataGridViewTextBoxColumn { Name = "Status", AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells, HeaderText = "Статус", ReadOnly = true });
			dgv.Columns.Add(new DataGridViewTextBoxColumn { Name = "Stem", AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells, HeaderText = "Основа слова", ReadOnly = true });
			dgv.Columns.Add(new DataGridViewTextBoxColumn { Name = "Weight", AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells, HeaderText = "Вес слова в теме", ReadOnly = true });
			dgv.Columns.Add(new DataGridViewTextBoxColumn { Name = "Count", AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells, HeaderText = "Количество слов в тексте", ReadOnly = true });
			dgv.Columns.Add(new DataGridViewTextBoxColumn { Name = "Sum", AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells, HeaderText = "Суммарный вес", ReadOnly = true });
			dgv.CellValueChanged += dgv_CellValueChanged;

			foreach (var weight in weights)
			{
				var rowIdx = dgv.Rows.Add();
				var row = dgv.Rows[rowIdx];
				row.Cells["FullText"].Value = _tc.GetFirstFullText(weight.Key);
				row.Cells["Stem"].Value = weight.Key;
				row.Cells["Weight"].Value = weight.Value.Item1;
				row.Cells["Count"].Value = weight.Value.Item2;
				row.Cells["Sum"].Value = weight.Value.Item1 * weight.Value.Item2;
			}

			dgv.Sort(dgv.Columns["Sum"], ListSortDirection.Descending);
			dgv.MouseClick += dgv_MouseClick;
		}

		void dgv_MouseClick(object sender, MouseEventArgs e)
		{
			var dgv = sender as DataGridView;
			if (e.Button == MouseButtons.Right) // если правой кнопкой
			{
				_dgvContextClick = dgv;
				DataGridView.HitTestInfo hitTestInfo = dgv.HitTest(e.X, e.Y);
				if (hitTestInfo.Type == DataGridViewHitTestType.Cell)
				{
					var rowIdx = hitTestInfo.RowIndex;
					var row = dgv.Rows[rowIdx];
					var wordStem = row.Cells["Stem"].Value;
					dgv.ClearSelection();
					row.Selected = true;

					ContextMenuStrip cm = new ContextMenuStrip();

					cm.Items.Add(WordStatusText.GetText(WordStatus.WordNotInTheme), null, DeleteWord);
					cm.Items.Add(WordStatusText.GetText(WordStatus.WordAreIgnored), null, IgnoreWord);
					cm.Items.Add(WordStatusText.GetText(WordStatus.WordInTheme), null, AddWord);
					cm.Items.Add(WordStatusText.GetText(WordStatus.WordInThemeLexicalized), null, LexicalizedWord);

					var status = _tc.GetWordStatus(CurrentTheme, CurrentWord);
					foreach (var item in cm.Items.Cast<ToolStripItem>())
						item.Click += OnChangeStatus;
					foreach (var item in cm.Items.Cast<ToolStripItem>().Where(i => i.Text == WordStatusText.GetText(status)))
						item.BackColor = Color.Aqua;
					cm.Show(dgv, new Point(e.X, e.Y));
				}
			}
		}

		/// <summary>Текущая тема (вкладка)
		/// </summary>
		private string CurrentTheme
		{
			get
			{
				var tabPage = (TabPage)_dgvContextClick.Parent;
				var caption = tabPage.Text.Substring(0, tabPage.Text.IndexOf('/'));
				if (!_groups.ContainsKey(caption))
				{
					var name = _tc.GetGroupNameByCaption(caption, _tc.GetGroupThemeIdByGroupThemeName(comboBoxThemeGroup.Text));
					_groups.Add(caption, name);
				}
				return _groups[caption];
			}
		}

		/// <summary>Текущее слово (строка в гриде на которую кликнули правой клавишой мыши)
		/// </summary>
		private string CurrentWord
		{
			get
			{
				return _dgvContextClick.SelectedRows.Cast<DataGridViewRow>().Single().Cells["Stem"].Value.ToString();
			}
		}

		/// <summary>Задаёт новый вес слова и новый суммарый вес слова в рамках текущей темы
		/// </summary>
		/// <param name="weight"></param>
		private void SetNewWeightForCurrentWord(double weight)
		{
			var row = _dgvContextClick.SelectedRows.Cast<DataGridViewRow>().Single();
			row.Cells["Weight"].Value = weight;
			var count = double.Parse(row.Cells["Count"].Value.ToString());
			var sum = weight * count;
			row.Cells["Sum"].Value = sum;
		}

		#region Обработчики контекстного меню

		/// <summary>Слово НЕ относится к теме
		/// </summary>
		private void DeleteWord(object sender, EventArgs e)
		{
			SetNewWeightForCurrentWord(_tc.DeleteWord(comboBoxThemeGroup.Text, CurrentTheme, CurrentWord));
		}

		/// <summary>Слово может относиться к теме (в некотором контексте)
		/// </summary>
		private void IgnoreWord(object sender, EventArgs e)
		{
			SetNewWeightForCurrentWord(_tc.IgnoreWord(comboBoxThemeGroup.Text, CurrentTheme, CurrentWord));
		}

		/// <summary>Слово относится к теме
		/// </summary>
		private void AddWord(object sender, EventArgs e)
		{
			SetNewWeightForCurrentWord(_tc.AddWord(comboBoxThemeGroup.Text, CurrentTheme, CurrentWord));
		}

		/// <summary>Слово относится ТОЛЬКО к данной теме
		/// </summary>
		private void LexicalizedWord(object sender, EventArgs e)
		{
			SetNewWeightForCurrentWord(_tc.AddLexicalizedWord(comboBoxThemeGroup.Text, CurrentTheme, CurrentWord));
		}

		#endregion

		#endregion

		private void buttonCheck_Click(object sender, EventArgs e)
		{
			var answer = _tc.Check(richTextBoxMainText.Text);
			if (answer == null)
			{
				MessageBox.Show("Программа была обучена неверно или не была обучена");
				return;
			}
			_groups = new Dictionary<string, string>();
			var sum = answer.Sum(a => a.Value);
			var text = string.Join(Environment.NewLine, answer.Select(a => _tc.GetGroupCaptionByName(a.Key, _tc.GetGroupThemeIdByGroupThemeName(comboBoxThemeGroup.Text)).PadRight(35, '_') + Math.Round(a.Value/sum, 1).ToString().PadLeft(5,'_') + ":" + Math.Round(a.Value,2).ToString().PadRight(2,'0')));

			var statistics = _tc.GetLastStatistics;
			tabControlThemes.TabPages.Clear();

			foreach (var statistic in statistics)
				SetThemeStatistics(statistic.Key, statistic.Value);

			MessageBox.Show(text);
		}
		private void buttonExportToFile_Click(object sender, EventArgs e)
		{
			var sfd = new SaveFileDialog();
			if (sfd.ShowDialog() == DialogResult.OK)
				_tc.ExportToFolder(sfd.FileName);
		}
		private void buttonImport_Click(object sender, EventArgs e)
		{
			var ofd = new OpenFileDialog { Multiselect = true };
			if (ofd.ShowDialog() == DialogResult.OK)
			{
				var import = _tc.Import(ofd.FileNames);
				if (import != null)
					SetGroups(import);
			}
		}
		private void buttonExportToDataBase_Click(object sender, EventArgs e)
		{
			if (MessageBox.Show("Вы уверены в том что хотите добавить слова в базу?", "Вопроооос", MessageBoxButtons.YesNo) == System.Windows.Forms.DialogResult.No)
				return;
			_tc.ExportToDataBase(comboBoxThemeGroup.Text);
		}
		private void buttonLoadLexicalizedWords_Click(object sender, EventArgs e)
		{
			var ofd = new OpenFileDialog { Multiselect = true };
			var stemmer = new Stemming();
			if (ofd.ShowDialog() == DialogResult.OK)
			{
				foreach (var filename in ofd.FileNames)
				{
					var theme = Path.GetFileNameWithoutExtension(filename);
					var words = new List<string>();
					var sr = new StreamReader(filename, Encoding.Default);
					while (!sr.EndOfStream)
					{
						var word = _tc.NormilizeText(sr.ReadLine());
						word = word.Trim();
						if (word.IndexOf(' ') >= 0)
							continue;
						word = stemmer.Stem(word);
						words.Add(word);
					}
					_tc.LoadLexicalizedWords(comboBoxThemeGroup.Text, theme, words);
					sr.Close();
				}
			}
		}

		/// <summary>получить список имён всех групп
		/// </summary>
		private List<string> Groups
		{
			get
			{
				var answer = new List<string>();
				foreach (var row in dataGridViewGroups.Rows.Cast<DataGridViewRow>().Where(row => !row.IsNewRow))
				{
					answer.Add((string)row.Cells["ColumnGroupName"].Value);
				}
				return answer;
			}
		}

		/// <summary>отображает имена в гриде с группами
		/// </summary>
		/// <param name="groups"></param>
		private void SetGroups(List<string> groups)
		{
			dataGridViewGroups.Rows.Clear();
			foreach (var group in groups)
			{
				var idx = dataGridViewGroups.Rows.Add();
				dataGridViewGroups.Rows[idx].Cells["ColumnGroupName"].Value = group;
			}
		}

		#endregion

		#region Файлы с группами

		/// <summary>задать имя файл в строку грида (обработчик для кнопка грида)
		/// </summary>
		/// <param name="row"></param>
		private void SetFileName(DataGridViewRow row)
		{
			var defaultPath = string.Empty;
			if (row.Cells["ColumnGroupFilePath"].Value != null)
				defaultPath = Directory.GetParent(row.Cells["ColumnGroupFilePath"].Value.ToString()).FullName;
			var ofd = new OpenFileDialog { Filter = "Text File|*.txt" };
			if (defaultPath != null)
				ofd.FileName = defaultPath;
			if (ofd.ShowDialog() == DialogResult.OK)
				row.Cells["ColumnGroupFilePath"].Value = ofd.FileName;
		}

		/// <summary>получение списка групп со всеми текстами группы в виде одной строки
		/// !!!!_wordsWeigthInGroups должен быть заполнен!!!!
		/// </summary>
		/// <returns></returns>
		private Dictionary<string, string> GetGroups()
		{
			var answer = new Dictionary<string, string>();
			foreach (var row in dataGridViewGroups.Rows.Cast<DataGridViewRow>().Where(row => !row.IsNewRow))
			{
				var texts = TextClassificator.LoadGroup((string)row.Cells["ColumnGroupFilePath"].Value);
				if (texts == null)
					throw new FileNotFoundException(string.Format("В строке {0} грида с группами не найден файл"));
				answer.Add((string)row.Cells["ColumnGroupName"].Value, texts);
			}
			return answer;
		}

		#endregion

		#region Разделители и стоп слова

		private List<string> _stopWords;
		private List<string> _separators;

		private List<string> Separators
		{
			get
			{
				if (_separators == null)
				{
					_separators = new List<string>();

					var fs = (string)Properties.Resources.ResourceManager.GetObject(TextClassificator.SeparatorsFileName);
					_separators = fs.Split(new[] { "\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
				}
				return _separators;
			}
		}
		private List<string> StopWords
		{
			get
			{
				if (_stopWords == null)
				{
					var fs = (string)Properties.Resources.ResourceManager.GetObject(TextClassificator.StopWordsFileName);
					_stopWords = fs.Split(new[] { "\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
				}
				return _stopWords;
			}
		}

		#endregion	

	}
}