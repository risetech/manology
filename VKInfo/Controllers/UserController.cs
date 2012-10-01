using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using VKInfo.Models;

namespace VKInfo.Controllers
{
	public class UserController : Controller
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
		public ActionResult Auth()
		{
			return View();
		}

	}
}
