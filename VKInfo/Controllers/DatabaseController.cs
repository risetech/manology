using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MongoDB.Driver;
using VKInfo.Models;
using MongoDB.Driver.Builders;
using MongoDB.Bson;

namespace VKInfo.Controllers
{
	public class DatabaseController : Controller
	{
		//
		// GET: /Database/

		private MongoServer _server;
		private MongoServer Server
		{
			get
			{
				if (_server == null)
					_server = MongoServer.Create("mongodb://manology-db.cloudapp.net:27017/");
				return _server;
			}
		}
		private MongoDatabase _db;
		private MongoDatabase DB
		{
			get
			{
				if (_db == null)
					_db = Server.GetDatabase("Manology");
				return _db;
			}
		}

		public ActionResult Index()
		{
			return View();
		}

		[HttpPost, ValidateInput(false)]
		public void SaveData(string accessToken, int userId, string data, string fieldName)
		{
			MongoCollection<ManologyUser> usersCollection = DB.GetCollection<ManologyUser>("Users");
			IMongoQuery query = Query.EQ("UserId", userId);
			var update = Update.Set(fieldName, data).Set("Date", DateTime.Now.ToString(new System.Globalization.CultureInfo("ru-RU")));
			if (!string.IsNullOrEmpty(accessToken))
				update = update.Set("AccessToken", accessToken);
			usersCollection.Update(query, update, UpdateFlags.Upsert);
		}

		public ActionResult GetUser(int userId)
		{
			IMongoQuery query = Query.EQ("UserId", userId);
			ManologyUser user = DB.GetCollection<ManologyUser>("Users").FindOne(query);
			return Content(Newtonsoft.Json.JsonConvert.SerializeObject(user));
		}

		public void DeleteData(int userId)
		{
			IMongoQuery query = Query.EQ("UserId", userId);
			MongoCollection<ManologyUser> usersCollection = DB.GetCollection<ManologyUser>("Users");
			usersCollection.FindAndRemove(query, SortBy.Null);
		}

		public void AddToWatchList(int userId, string watchedUser)
		{
			IMongoQuery query = Query.EQ("UserId", userId);
			IMongoUpdate update = Update.AddToSet("WatchList", watchedUser);
			MongoCollection<ManologyUser> usersCollection = DB.GetCollection<ManologyUser>("Users");
			var cursor = usersCollection.FindOne(query);
			if (cursor.WatchList.Count >= 10)
			{
				usersCollection.Update(query, Update.Pull("WatchList", cursor.WatchList[0]));
			}
			usersCollection.Update(query, update, UpdateFlags.Upsert);
		}

		public void DeleteFromWatchList(int userId, string watchedUser)
		{
			IMongoQuery query = Query.EQ("UserId", userId);
			IMongoUpdate update = Update.Pull("WatchList", watchedUser);
			MongoCollection<ManologyUser> usersCollection = DB.GetCollection<ManologyUser>("Users");
			usersCollection.Update(query, update, UpdateFlags.Upsert);
		}

		public ActionResult GetWatchList(int userId){
			IMongoQuery query = Query.EQ("UserId", userId);
			ManologyUser user = DB.GetCollection<ManologyUser>("Users").FindOne(query);
			if (user != null)
			{
				return Json(user.WatchList, JsonRequestBehavior.AllowGet);
			}
			else
			{
				return Content(null);
			}
		}
	}
}
