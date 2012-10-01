using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TextClassifierLib
{
	public enum WordStatus
	{
		/*WordNotInTheme = "Слово НЕ относится к теме", 
		WordInTheme = "Слово относится к теме", 
		WordInThemeLexicalized = "Слово относится ТОЛЬКО к данной теме", 
		WordAreIgnored = "Слово может относиться к теме (в некотором контексте)", 
		Other = "Другое" */

		WordNotInTheme, WordInTheme, WordInThemeLexicalized, WordAreIgnored, Other
	}

	public static class WordStatusText
	{
		public static string GetText(WordStatus status)
		{
			switch (status)
			{
				case WordStatus.WordNotInTheme:
					return "Слово НЕ относится к теме";
				case WordStatus.WordInTheme:
					return "Слово относится к теме";
				case WordStatus.WordInThemeLexicalized:
					return "Слово относится ТОЛЬКО к данной теме";
				case WordStatus.WordAreIgnored:
					return "Слово может относиться к теме (в некотором контексте)";
				case WordStatus.Other:
					return "Другое";
				default:
					throw new NotImplementedException("Неизвестный статус");
			}
		}
	}
}
