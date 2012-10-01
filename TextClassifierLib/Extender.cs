using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Objects;
using System.Reflection;

namespace TextClassifierLib
{
	/// <summary>
	/// монада монад
	/// </summary>
	public static class Extender
	{
		/// <summary>
		/// Переходит в новый контекст при не null родительском контексте
		/// </summary>
		/// <typeparam name="TInput">Тип входного контекста</typeparam>
		/// <typeparam name="TResult">Тип выходного контекста</typeparam>
		/// <param name="o">Объект для проверки на null</param>
		/// <param name="evaluator">Функция для смены контекста</param>
		/// <param name="resultIfNull">Результат для null</param>
		/// <returns>Новый контекст</returns>
		public static TResult With<TInput, TResult>(this TInput o, Func<TInput, TResult> evaluator, TResult resultIfNull)
			where TInput : class
		{
			if (o == null) return resultIfNull;
			return evaluator(o);
		}
		public static bool IsNull<TInput>(this TInput o)
			where TInput:class
		{
			return (o==null);
		}
	}
}
