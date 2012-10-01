﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MongoDB;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VKInfo.Models
{
	public class ManologyUser
	{
		[BsonId]
		public ObjectId id { get; set; }
		public int UserId { get; set; }
		public string AccessToken { get; set; }
		public string LikedMeUsers { get; set; }
		public string PopularPhotos { get; set; }
		public string PopularPosts { get; set; }
		public string FavouriteUsers { get; set; }
		public string FavouriteGroups { get; set; }
		public string LinguisticAnalysis { get; set; }
		public string UniversityRating { get; set; }
		public string CityRating { get; set; }
		public string Friends { get; set; }
		public string AllPosts { get; set; }
		public string LikedContent { get; set; }
		public string Date { get; set; }
		public string Interests { get; set; }
		public string Themes { get; set; }
		public List<string> WatchList { get; set; }

		public ManologyUser()
		{
			WatchList = new List<string>();
		}


	}

	//public class UserInWatchList
	//{
	//	[BsonId]
	//	public int UserId { get; set; }
	//	public string FirstName { get; set; }
	//	public string SecondName  { get; set; }
	//	public string MyProperty { get; set; }
	//	public string Photo { get; set; }
	//}
}