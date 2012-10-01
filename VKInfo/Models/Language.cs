using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;

namespace VKInfo.Models
{
	public class Language
	{
		#region Layout
		public string SearchPlaceholder { get; set; }
		public string SubheadMe { get; set; }
		public string SubheadYou { get; set; }
		public string SubheadLinguistic { get; set; }
		public string SubheadHobbies { get; set; }
		public string SubheadFriends { get; set; }
		#endregion

		#region MainPage
		public string PageHeaderH1 { get; set; }
		public string PageHeaderSmall { get; set; }

		public string Span5Well { get; set; }

		public string Span7HeartH1 { get; set; }
		public string Span7BookH1 { get; set; }
		public string Span7EyeH1 { get; set; }
		public string Span7UserH1 { get; set; }

		public string Span7HeartSmall { get; set; }
		public string Span7BookSmall { get; set; }
		public string Span7EyeSmall { get; set; }
		public string Span7UserSmall { get; set; }

		public string Span12 { get; set; }

		public string ImageKnow { get; set; }
		public string ImageKnowBR { get; set; }

		public string ImageFind { get; set; }
		public string ImagePrepare { get; set; }
		public string ImagePrepareBR { get; set; }
		public string ImageGo { get; set; }
		public string ImageChoose { get; set; }
		public string ImageChooseBR { get; set; }
		public string ImageSee { get; set; }
		public string ImageSeeBR { get; set; }

		#endregion

		public void FillText(string lang)
		{
			XmlDocument doc = new XmlDocument();
			doc.Load(AppDomain.CurrentDomain.BaseDirectory + "Language\\" + lang + ".xml");
			var nodes = doc.SelectSingleNode("root").ChildNodes;
			foreach (XmlElement item in nodes)
			{
				var prop = typeof(Language).GetProperty(item.Name);
				if (prop != null)
					prop.SetValue(this, item.InnerText, null);
			}
		}
	}
}