using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace VKInfo.Controllers
{
	public class SearchController : Controller
	{
		//
		// GET: /Search/

		[HttpPost]
		public ActionResult Index(string q)
		{
			if (q.Contains("vk.com"))
			{
				string profileId = q.Split('/').Last();
				return RedirectToActionPermanent("Me", "Like", new { id = profileId });
			}
			return View();
		}

	}
}
