using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using VKInfo.Models;

namespace VKInfo.Controllers
{
	public class HomeController : Controller
	{
		private Language _lang = new Language();

		protected override ViewResult View(string viewName, string masterName, object model)
		{
			return base.View(viewName, masterName, _lang);
		}

		protected override void OnActionExecuting(ActionExecutingContext filterContext)
		{
			string lang = Request.Cookies["lang"] != null ? Request.Cookies["lang"].Value : "ru";
			_lang.FillText(lang);
			base.OnActionExecuting(filterContext);
		}

		public ActionResult Index()
		{
			return View();
		}

		public ActionResult LikeYou()
		{
			return View();
		}

		public ActionResult About()
		{
			return View();
		}

		public ActionResult Friends()
		{
			return View();
		}

		public ActionResult Linguistic()
		{
			return View();
		}
		public ActionResult Hobbies()
		{
			return View();
		}
		public ActionResult Contacts()
		{
			return View();
		}
		private string ToNormalWord(string word)
		{
			switch (word)
			{
				case "psy":
					return "Психология";
				case "policy":
					return "Политика";
				case "mathematics":
					return "Математика";
				case "medicine":
					return "Медицина";
				case "it":
					return "Информационные технологии";
				default:
					return "Неизвестно";
			}
		}

		public ActionResult Analisys(List<Post> posts)
		{
			var tc = TextClassifierLib.TextClassificator.LearnedInstance;
			List<object> result = new List<object>();
			if (tc != null && posts != null)
			{
				foreach (var p in posts)
				{
					var checkResult = tc.Check(p.Text);
					result.Add(new { ID = p.ID, Info = checkResult });
				}
				//var result = tc.Check(posts.Aggregate((o, s) => o + " " + s)).Where(o => o.Key != "tp");
				//double sum = result.Sum(o => o.Value);
				//return Json(result.Select(o => new { name = ToNormalWord(o.Key), y = o.Value * 100 / sum }), JsonRequestBehavior.AllowGet);
			}
			return Json(result);
		}

		public ActionResult TextAnalisys(string text)
		{
			var tc = TextClassifierLib.TextClassificator.LearnedInstance;
			List<object> result = new List<object>();
			if (tc != null && text != null)
			{
				var checkResult = tc.Check(text);
				result.Add(checkResult);
				//var result = tc.Check(posts.Aggregate((o, s) => o + " " + s)).Where(o => o.Key != "tp");
				//double sum = result.Sum(o => o.Value);
				//return Json(result.Select(o => new { name = ToNormalWord(o.Key), y = o.Value * 100 / sum }), JsonRequestBehavior.AllowGet);
			}
			return Json(result);
		}
		public class Post
		{
			public int ID { get; set; }
			public string Text { get; set; }
		}
	}
}
