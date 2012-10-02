using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.IO;
using TextClassifierLib;

namespace VKInfo
{
	// Note: For instructions on enabling IIS6 or IIS7 classic mode, 
	// visit http://go.microsoft.com/?LinkId=9394801

	public class MvcApplication : System.Web.HttpApplication
	{
		public static void RegisterGlobalFilters(GlobalFilterCollection filters)
		{
			filters.Add(new HandleErrorAttribute());
		}

		public static void RegisterRoutes(RouteCollection routes)
		{
			routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

			routes.MapRoute(
				"Default", // Route name
				"{controller}/{action}/{id}", // URL with parameters
				new { controller = "Home", action = "Index", id = UrlParameter.Optional } // Parameter defaults
			);

		}
		private string trainigFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "trainingFolder");
		protected void Application_Start()
		{
			AreaRegistration.RegisterAllAreas();

			RegisterGlobalFilters(GlobalFilters.Filters);
			RegisterRoutes(RouteTable.Routes);
			var tc = TextClassificator.LearnedInstance;
			/*if (TextClassifierLib.TextClassificator.Instance == null && !Directory.Exists(trainigFolder))
			{
			    TextClassifierLib.TextClassificator.Instance = TextClassifierLib.TextClassificator.CreateLearnedInstance();
			    TextClassifierLib.TextClassificator.Instance.ExportToFolder(trainigFolder,false);
			}
			else
				if (Directory.Exists(trainigFolder))
				{
					TextClassifierLib.TextClassificator.Instance = new TextClassifierLib.TextClassificator();
					TextClassifierLib.TextClassificator.Instance.Import(Directory.GetFiles(trainigFolder));
				}*/
			TextClassificator.CreateLearnedInstance("extra-intra");
			TextClassificator.CreateLearnedInstance("logic-etic");

			TextClassificator.CreateLearnedInstance("racional-irracional");

			TextClassificator.CreateLearnedInstance("sensor-intuit");
		}
	}
}