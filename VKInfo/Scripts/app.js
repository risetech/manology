/// <reference path="jquery-1.7.2-vsdoc.js" />

var app = {
	appId: 3016703,
	appSecret: "Zz8fFBdaRDyMBQ0NDElV",
	redirectUri: "http://manology.info/User/Auth"

	/*appId: 2995743,
	appSecret: "5pxH8x5L8rT977WflGn0",
	redirectUri: "http://127.0.0.1:4621/User/Auth"*/
}

getSVG = function (charts) {
	var svgArr = [],
        top = 0,
        width = 0;

	$.each(charts, function (i, chart) {
		var svg = chart.getSVG();
		svg = svg.replace('<svg', '<g transform="translate(0,' + top + ')" ');
		svg = svg.replace('</svg>', '</g>');

		top += chart.chartHeight;
		width = Math.max(width, chart.chartWidth);

		svgArr.push(svg);
	});

	return '<svg height="' + top + '" width="' + width + '" version="1.1" xmlns="http://www.w3.org/2000/svg">' + svgArr.join('') + '</svg>';
};

var contentTypeChart;
var groupRepostsChart;
var postsAndLikesChart;

var favouriteGroups = {};  //группы, которые я лайнкул
var favouriteUsers = {};   //пользователи, которых я лайкнул
var likedMeUsers = {};    //пользователи, которые лайкнули меня
var likedContent = []; //все, что лайкнули

var viewer_id = localStorage['viewer_id'] || "";
var user_id = localStorage['user_id'] || "";
var user_link = localStorage['user_link'] || "";

var scope = "friends,wall,video,photos,groups,pages";
var auth = function () {
	location.href = "http://oauth.vk.com/authorize?client_id=" + app.appId + "&display=page&scope=" + scope + "&redirect_uri=" + app.redirectUri + "&response_type=token";
}
var access_token = getCookie("access_token") || "";

var wallText = {}; 	 //слова постов со стены
var repostText = {}; //слова с репостов
var wallWords = [];
var filthyFilter = ["fuck", "бля", "бляди", "блядь", "блять", "блеать", "блеять", "выебал", "выебать", "выебу", "гавно", "говно", "говнюк", "гавнюк", "гондон", "гандон", "ебаная", "ебаной", "ебану", "ебать", "ебну", "ебнуть", "ебошила", "ебошить", "ебырь", "жопа", "заебал", "заебу", "мудак", "мудило", "наебать", "наебка", "нахуй", "отсос", "охуел", "охуеть", "педораз", "педорас", "пидараз", "пидарас", "пидор", "пидораз", "пдорас", "пизда", "пиздец", "пиздить", "пизду", "пизды", "пиписька", "писька", "письку", "проститутка", "проститутки", "спиздить", "сука", "хер", "хуй", "хуйня", "хуя", "хуяч", "цела", "шлюха"];
var showErrorBar = false;
var recalcUser = false;
var currentUserModel = {};

function getCookie(name) {
	var matches = document.cookie.match(new RegExp(
	  "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	))
	return matches ? decodeURIComponent(matches[1]) : undefined
}

function setCookie(name, value, props) {
	props = props || {}
	var exp = props.expires
	if (typeof exp == "number" && exp) {
		var d = new Date()
		d.setTime(d.getTime() + exp * 1000)
		exp = props.expires = d
	}
	if (exp && exp.toUTCString) { props.expires = exp.toUTCString() }
	value = encodeURIComponent(value)
	var updatedCookie = name + "=" + value
	for (var propName in props) {
		updatedCookie += "; " + propName
		var propValue = props[propName]
		if (propValue !== true) { updatedCookie += "=" + propValue }
	}
	document.cookie = updatedCookie
}

function deleteCookie(name) {
	localStorage['user_id'] = "";
	setCookie(name, null, { expires: -100, path: '/' })
}

function changeLang(lang) {
	setCookie("lang", lang, { path: '/' })
	window.location.reload();
	return false;
}

function saveDataToMongoDB(data, fieldName) {
	var userId = user_id ? user_id.split('=')[1] : viewer_id;
	var accessToken = user_id.split('=')[1] == viewer_id ? access_token : null;
	console.log(fieldName + ': ' + data.length);
	$.ajax({
		type: 'POST',
		url: '/Database/SaveData',
		data: { accessToken: accessToken, userId: userId, data: data, fieldName: fieldName },
		success: function () {
			console.log('success');
		}
	});
}

function recalculateStats() {
	recalcUser = true;
	var userId = user_id ? user_id.split('=')[1] : viewer_id;
	localStorage['recalcUserId'] = userId;
	location.href = "/Like/Me";
	//$.ajax({
	//	type: 'POST',
	//	url: '/Database/DeleteData',
	//	data: { userId: userId },
	//	success: function () {
	//		location.href = "/Like/Me";
	//	}
	//});
}

function getWatchList() {
	$.ajax({
		type: 'GET',
		url: '/Database/GetWatchList',
		data: { userId: viewer_id },
		success: function (data) {
			var model = [];
			if (data) {
				model = data.reverse();
				model = model.map(function (item) {
					return JSON.parse(item);
				});
			}
			ko.applyBindings(new WatchListModel(model), $('#recently-watched')[0]);
		}
	});
}

function deleteFromWatchList(watchedUser) {
	$.ajax({
		type: 'POST',
		url: '/Database/DeleteFromWatchList',
		data: { userId: viewer_id, watchedUser: watchedUser }
	});
}

function WatchListModel(data) {
	var self = this;
	self.watchList = ko.observableArray([]);
	self.showWatchList = ko.observable(data.length != 0);
	var mappedUsers = $.map(data, function (item) { return new CurrentUserModel(item) });
	self.watchList(mappedUsers);
	self.deleteFromWatchList = function (item) {
		self.watchList.remove(item);
		deleteFromWatchList(item.stringifiedUser());
	}
}

var foo;
function loadData(userId) {
	$.ajax({
		type: 'GET',
		url: '/Database/GetUser',
		data: { userId: userId },
		success: function (user) {
			currentUserModel = JSON.parse(user);
			if (user != "null" && !recalcUser) {
				var userObj = JSON.parse(user);
				foo = userObj.Date;
				$('.user-header').prepend('<span class="last-check">Последний пересчет ' + userObj.Date + '</span>');
				ko.applyBindings(new LinguisticAnalysisModel(JSON.parse(userObj.LinguisticAnalysis)), $('#reposts-comment')[0]);

				ko.applyBindings(new LikedMeRatingModel(JSON.parse(userObj.LikedMeUsers)), $('#top-liked-me-users')[0]);
				$('#likedme-rating, #top-liked-me-users .form-actions').show();

				ko.applyBindings(new PhotoRatingModel(JSON.parse(userObj.PopularPhotos)), $('#most-liked-photo')[0]);
				$('#likedphotos-rating, #most-liked-photo .form-actions').show();

				ko.applyBindings(new PostRatingModel(JSON.parse(userObj.PopularPosts)), $('#most-liked-post')[0]);
				$('#likedposts-rating, #most-liked-post .form-actions').show();

				if (userId === viewer_id) {
					if (userObj.FavouriteGroups) {
						ko.applyBindings(new FavouriteGroupsRatingModel(JSON.parse(userObj.FavouriteGroups)), $('#top-liked-pages')[0]);
						$('#favourite-groups-rating, #top-liked-pages .form-actions').show();
					}
					if (userObj.FavouriteUsers) {
						ko.applyBindings(new FavouriteUsersRatingModel(JSON.parse(userObj.FavouriteUsers)), $('#top-liked-users')[0]);
						$('#favourite-users-rating, #top-liked-users .form-actions').show();
					}
					if (!userObj.FavouriteGroups && !userObj.FavouriteUsers) {
						getFavourites();
					}
				}

				allPosts = JSON.parse(userObj.AllPosts);
				if (allPosts) {
					renderHobbies(allPosts);

					renderContentTypeInfo(allPosts);

					renderGroupReposts(allPosts);
					wordSplitter(allPosts);
					sendWords();

					renderPostsAndLikesByMonthsGraph(JSON.parse(userObj.LikedContent));
				}

				dataLoaded();
			}
			else {
				if (userId === viewer_id || !localStorage['user_id']) {
					getFavourites();
				}
				loadAllPosts(0);
			}
		}
	});
}

function getData() {
	var userId = user_id ? user_id.split('=')[1] : viewer_id;
	if (localStorage["recalcUserId"]) {
		recalcUser = true;
		localStorage.removeItem("recalcUserId");
	}
	loadData(userId);
}

function findInfilthyFilter(word) {
	for (var i = 0; i < filthyFilter.length; i++) {
		if (filthyFilter[i] == word)
			return true;
	}
	return false;
}

function wordSplitter(posts) {
	var reg = /\s+|<br>|,|\.|!|;|\)|\(|\:|\?|\-/;
	for (var i = 1; i < posts.length; i++) {
		if (posts[i].copy_text || !posts[i].copy_owner_id) {
			var buf = posts[i].copy_text ? posts[i].copy_text.split(reg) : posts[i].text.split(reg);
			for (var j = 0; j < buf.length; j++) {
				if (buf[j]) {
					var elem = buf[j].toLowerCase();
					wallWords.push(elem);
					if (wallText[elem]) {
						wallText[elem].count++;
						wallText[elem].posts.push(posts[i]);
					}
					else {
						wallText[elem] = { count: 0, posts: [] };
						wallText[elem].count = 1;
						wallText[elem].posts.push(posts[i]);
					}
				}
			}
		}
		if (posts[i].copy_owner_id) {
			var buf = posts[i].text.split(reg);
			for (var j = 0; j < buf.length; j++) {
				if (buf[j]) {
					var elem = buf[j].toLowerCase();
					wallWords.push(elem);
					if (repostText[elem]) {
						repostText[elem][0]++;
						repostText[elem].push(posts[i]);
					}
					else {
						repostText[elem] = [];
						repostText[elem][0] = 1;
						repostText[elem].push(posts[i]);
					}
				}
			}
		}
	}
	return Object.keys(repostText);
};

function renderLinguisticAnalysis() {
	var linguisticModel = {};
	linguisticModel['uniqueWordsInPosts'] = Object.keys(wallText).length;
	linguisticModel['badLanguagePosts'] = [];
	linguisticModel['badLanguageWordsCount'] = 0;
	for (var p in wallText) {
		if (findInfilthyFilter(p)) {
			linguisticModel['badLanguageWordsCount'] += wallText[p].count;
			linguisticModel['badLanguagePosts'] = linguisticModel['badLanguagePosts'].concat(wallText[p].posts);
		}
	}
	linguisticModel['uniqueWordsInReposts'] = Object.keys(repostText).length;
	var longWords = [];
	for (var i = 0; i < wallWords.length - 1; i++) {
		if (wallWords[i].length > 3) {
			longWords.push(wallWords[i]);
		}
	}
	linguisticModel['topWords'] = groupby(longWords, '', 100);
	saveDataToMongoDB(JSON.stringify(linguisticModel), 'LinguisticAnalysis');
	ko.applyBindings(new LinguisticAnalysisModel(linguisticModel), $('#reposts-comment')[0]);
};

function toNormalTitle(word) {

	if (getCookie("lang") == "en")
		switch (word) {
			case "psy":
				return "Psychology";
			case "policy":
				return "Policy";
			case "mathematics":
				return "Mathematics";
			case "medicine":
				return "Medicine";
			case "it":
				return "Information Technology";
			default:
				return "None";
		}
	else
		switch (word) {
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

			case "auto":
				return "Автомобили";
			case "biologiy":
				return "Биология";
			case "culinariy":
				return "Еда";
			case "cultura":
				return "Культура, искусство";
			case "economica":
				return "Экономика";

			case "himiy":
				return "Химия";
			case "philosof":
				return "Философия, религия";
			case "phizica":
				return "Физика";
			case "muzica":
				return "Музыка";
			case "sport":
				return "Спорт";
			default:
				return "Неизвестно";
		}
};

function toShortPost(text) {
	if (text.length > 1000)
		return text.substring(0, 998) + "..";
	return text;
};

function getPostbyID(posts, id) {
	for (var p in posts)
		if (posts[p].id == id) return posts[p];
};

var allPosts = [];
function loadAllPosts(offset) {
	$.ajax({
		url: "https://api.vk.com/method/wall.get?" + access_token + user_id + "&offset=" + offset + "&count=100&filter=owner",
		dataType: "jsonp",
		success: function (data) {
			if (data && data.response.length > 0 && offset < data.response[0]) {
				wordSplitter(data.response);
				for (var i = 1; i < data.response[0]; i++) {
					if (data.response[i] != undefined) {
						allPosts.push(data.response[i]);
						if (data.response[i].likes.count > 0) {
							likedContent.push({ content: data.response[i], type: 'post' });
						}
					}
				}
				loadAllPosts(offset + 100);
			}
			else {

				saveDataToMongoDB(JSON.stringify(allPosts), 'AllPosts');

				renderHobbies(allPosts);

				renderContentTypeInfo(allPosts);

				renderGroupReposts(allPosts);

				sendWords();

				if (likedContent && likedContent.length == 0) {
					renderContentRating('post');
					getLikedPhotos([], 0);
				}
				else {
					getWhoLikedPosts();
				}

				renderLinguisticAnalysis();

			}
		}
	});
};

function renderGroupReposts(allPosts) {
	var groupIdsCount = {};
	var groupIds = [];
	var groupReposts = {};
	for (var i in allPosts) {
		if (allPosts[i].copy_owner_id && allPosts[i].copy_owner_id < 0) {
			if (!groupIdsCount[allPosts[i].copy_owner_id])
				groupIdsCount[allPosts[i].copy_owner_id] = []
			groupIdsCount[allPosts[i].copy_owner_id].push(allPosts[i]);
		}
	}
	for (var i in groupIdsCount) {
		groupIds.push([i, groupIdsCount[i]]);
	}
	groupIds.sort(function (a, b) {
		return b[1].length - a[1].length;
	});
	groupIds = groupIds.slice(0, 5);
	var counter = 0;
	for (var i in groupIds) {
		$.ajax({
			url: "https://api.vk.com/method/groups.getById?" + access_token + "&gids=" + (0 - groupIds[i][0]),
			beforeSend: function () {
				$(this).data('index', i);
			},
			dataType: "jsonp",
			success: function (data) {
				if (!groupReposts[data.response[0].name])
					groupReposts[data.response[0].name] = [];
				for (var j in groupIds[$(this).data('index')][1]) {
					groupReposts[data.response[0].name].push('<div class="text-wall">' + groupIds[$(this).data('index')][1][j].text.cut() + '<a target="_blank" href="http://vk.com/wall' + groupIds[$(this).data('index')][1][j].copy_owner_id + '_' + groupIds[$(this).data('index')][1][j].copy_post_id + '">  подробнее</a></div>');
				}
				counter++;
				if (counter === groupIds.length) {
					var seriesOptions = [];
					var repostCount = 0;
					for (var i in groupReposts) {
						seriesOptions.push({ name: i, data: [groupReposts[i].length] })
					}
					seriesOptions.sort(function (a, b) {
						return b.data[0] - a.data[0];
					});
					var mostReposted = seriesOptions[0].name;
					var postCount = 0;
					var repostCount = 0;
					for (var i in allPosts) {
						if (!allPosts[i].copy_owner_id) {
							postCount++;
						}
					}
					var postsPercentage = ((postCount / allPosts.length) * 100).toFixed(2).toString();
					$('#reposts-comment').append('<p>Больше всего репостов: ' + mostReposted + '</p>');
					$('#reposts-comment').append('<p>Собственных записей на стене: ' + postsPercentage + '%</p>');
					var conclusion = "";
					conclusion = postsPercentage >= 50 ? "Пользователь предпочитает писать сам" : "Пользователь предпочитает цитировать других людей";
					$('#reposts-comment').append('<p>' + conclusion + '</p>');
					seriesOptions = seriesOptions.slice(0, 5).reverse();
					for (var i in seriesOptions) {
						$template = $(groupReposts[seriesOptions[i].name]);
						$theme = $('<li><a href="#"><i class="icon-chevron-right"></i><span>' + seriesOptions[i].name + '</span><span> (' + seriesOptions[i].data[0] + ')<span></a></li>');
						$theme.click(function () {
							$('.active', $(this).parent()).removeClass('active')
							$(this).addClass('active')
							itemText = $($(this).find('a span')[0]).text();
							$('.links').empty();
							var length = groupReposts[itemText] ? groupReposts[itemText].length : 0;
							for (var j = 0; j < 20 && j < length; j++) {
								$('.links').append($(groupReposts[itemText][j]))
							}
							return false;
						});
						$('#subscribes-tab').after($theme)
					}
					if (seriesOptions.length === 0) {
						return false;
					}
					$('#group-reposts-chart').empty();
					groupRepostsChart = new Highcharts.Chart({
						chart: {
							renderTo: 'chart-container-invisible',
							type: 'bar',
							width: 150,
							height: 150
						},
						title: {
							text: 'Репосты групп'
						},
						xAxis: {
							categories: [''],
							title: {
								text: null
							}
						},
						legend: { enabled: false },
						yAxis: {
							min: 0,
							title: {
								text: ''
							},
							labels: {
								overflow: 'justify'
							},
							allowDecimals: false
						},
						tooltip: {
							formatter: function () {
								return 'Репосты "' + this.series.name + '": ' + this.y + ' ';
							}
						},
						plotOptions: {
							bar: {
								pointPadding: 0.2,
								borderWidth: 0,
								cursor: 'pointer',
								point: {
									events: {
										click: function (event) {
											var it = $('#chart-navigation li a:contains("' + this.series.name + '")').parent();
											it.click();
											$('body').animate({ scrollTop: it.offset().top }, 'slow');
										}
									}
								},
								dataLabels: {
									enabled: false,
									formatter: function () {
										var result = this.series.name + " - " + this.y;
										return result.cut()
									}
								}
							}
						},
						credits: {
							enabled: false
						},
						series: seriesOptions
					});
					var svg = getSVG([groupRepostsChart]);
					$('#group-reposts-chart').append($(svg));
				}
			}
		});
	}
}

function toNormalContentType(name) {
	if (getCookie('lang') == 'en') {
		switch (name) {
			case "photo":
			case "posted_photo":
				return "Photo";
			case "video":
				return "Video"
			case "audio":
				return "Audio";
			case "poll":
				return "Poll";
			case "graffiti":
				return "Graffiti";
		}
	}
	else
		switch (name) {
			case "photo":
			case "posted_photo":
				return "Фото";
			case "video":
				return "Видео"
			case "audio":
				return "Аудио";
			case "poll":
				return "Голосование";
			case "graffiti":
				return "Графити";
		}
};

String.prototype.cut = function (length) {
	length = length || 50;
	return this.substring(0, length).replace('\r', '').replace('\n', '').replace('<br>', '') + (this.length > 50 ? "..." : "");
};

function renderContentTypeInfo(posts) {
	var linksToPosts = {};
	var tabsOfPosts = [];
	var sum = 0;
	for (var p in posts) {
		if (posts[p].attachments) {
			for (var a in posts[p].attachments) {
				switch (posts[p].attachments[a].type) {
					case "photo":
					case "posted_photo":
						if (!linksToPosts[toNormalContentType("photo")]) {
							linksToPosts[toNormalContentType("photo")] = [];
						}
						var link = posts[p].attachments[a].photo ? posts[p].attachments[a].photo.src : posts[p].attachments[a].posted_photo.src;
						linksToPosts[toNormalContentType("photo")].push("<div class='image-wall'><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + "><img src='" + link + "'></img></a></div>");
						sum++;
						break;
					case "video":
						if (!linksToPosts[toNormalContentType("video")]) {
							linksToPosts[toNormalContentType("video")] = [];
						}
						linksToPosts[toNormalContentType("video")].push("<div class='image-wall'><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + "><img src='" + posts[p].attachments[a].video.image + "'></img></a></div>");
						sum++;
						break;
					case "audio":
						if (!linksToPosts[toNormalContentType("audio")]) {
							linksToPosts[toNormalContentType("audio")] = [];
						}
						linksToPosts[toNormalContentType("audio")].push("<div class='text-wall'>" + (posts[p].attachments[a].audio.performer + "-" + posts[p].attachments[a].audio.title).cut() + "<a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + ">  подробнее</a></div>");
						sum++;
						break;
					case "poll":
						if (!linksToPosts[toNormalContentType("poll")]) {
							linksToPosts[toNormalContentType("poll")] = [];
						}
						linksToPosts[toNormalContentType("poll")].push("<div class='text-wall'>" + posts[p].attachments[a].poll.question.cut() + "<a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + ">  подробнее</a></div>");
						sum++;
						break;
					case "graffiti":
						if (!linksToPosts[toNormalContentType("graffiti")]) {
							linksToPosts[toNormalContentType("graffiti")] = [];
						}
						linksToPosts[toNormalContentType("graffiti")].push("<div class='image-wall'><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + "><img src='" + posts[p].attachments[a].graffiti.src + "'></img></a></div>");
						sum++;
						break;

				}
			}
		}
		else {
			if (!linksToPosts["Текст"]) {
				linksToPosts["Текст"] = [];
			}
			linksToPosts["Текст"].push('<div class="text-wall">' + posts[p].text.cut() + '<a target="_blank" href="http://vk.com/wall' + posts[p].to_id + '_' + posts[p].id + '">  подробнее</a></div>');
			sum++;
		}
	}
	for (var l in linksToPosts) {
		$template = $(linksToPosts[l]);
		$theme = $('<li><a href="#"><i class="icon-chevron-right"></i><span>' + l + '</span><span> (' + linksToPosts[l].length + ')</span></a></li>');
		$theme.click(function () {
			$('.active', $(this).parent()).removeClass('active')
			$(this).addClass('active')
			itemText = $($(this).find('a span')[0]).text();
			$('.links').empty()
			var top20 = 0;
			for (var i = 0; i < 20 && i < linksToPosts[itemText].length; i++) {
				$('.links').append($(linksToPosts[itemText][i]))
			}
			return false;
		});
		$('#wall-tab').after($theme)
	}

	var chartData = [];
	var topContent = { name: Object.keys(linksToPosts)[0], count: 0 };
	if (sum != 0) {
		for (var i in linksToPosts) {
			if (linksToPosts[i].length > 0)
				chartData.push({ name: i, data: [linksToPosts[i].length] });
			if (linksToPosts[i].length > topContent.count) {
				topContent.name = i
				topContent.count = linksToPosts[i].length
			}
		}
		if (chartData.length > 0) {
			$('#content-type-comment').append('<p>Самый популярный тип записей на стене: ' + topContent.name + ' (' + topContent.count + ' записей)</p>');
			var conclusion = "";
			switch (topContent.name) {
				case "Фото": {
					conclusion = "Как у большинства пользователей VKontakte, на стене больше всего картинок";
					break;
				}
				case "Видео": {
					conclusion = "Пользователь делится с друзьями большим количеством видео";
					break;
				}
				case "Аудио": {
					conclusion = "Пользователь увлечен музыкой";
					break;
				}
				case "Голосование": {
					conclusion = "Пользователю интересны мнения в обществе";
					break;
				}
				case "Графити": {
					conclusion = "Пользователь любит рисовать";
					break;
				}
				case "Текст": {
					conclusion = "Пользователь часто пишет сам, ему есть, что сказать и чем поделиться"
				}

			}
			$('#content-type-comment').append('<p>' + conclusion + '</p>');
			$('#contentType-chart').empty();
			contentTypeChart = new Highcharts.Chart({
				chart: {
					renderTo: 'chart-container-invisible',
					type: 'column',
					width: 150,
					height: 150
				},
				xAxis: {
					categories: [''],
					title: {
						text: ''
					}
				},
				tooltip: {
					formatter: function () {
						return this.series.name + ': ' + this.y
					}
				},
				legend: {
					backgroundColor: '#FFFFFF',
					shadow: true,
					enabled: false
				},
				title: { text: 'Типы постов' },
				yAxis: {
					min: 0,
					title: {
						text: ''
					}
				},
				plotOptions: {
					column: {
						cursor: 'pointer',
						dataLabels: { enabled: false },
						point: {
							events: {
								click: function (event) {
									var it = $('#chart-navigation li a:contains("' + this.series.name + '")').parent();
									it.click();
									$('body').animate({ scrollTop: it.offset().top }, 'slow');
								}
							}
						}
					}
				},
				series: chartData,
				credits: { enabled: false }
			});
			var svg = getSVG([contentTypeChart]);
			$('#contentType-chart').append($(svg));
			return;
		}

	}
	if (getCookie('lang') == 'en')
		$('#contentType-chart').append($("<p>Do you have too few posts to determine their types.</p>"));
	else
		$('#contentType-chart').append($("<p>У Вас слишком мало постов, чтобы определить их типы.</p>"));

};

function inTheme(wordsCount, weight) {
	var x0 = 50; //максимальная количество слов для попадания в первый отрезок
	var x1 = 300; //..

	var y0 = 1.5; //минимальный вес в точке x0
	var y1 = 4; 	//..

	var x = wordsCount;
	var y = weight;

	var a = (y1 - y0) / (x1 - x0);

	if (y < y0)
		return false;

	if (x < x0)
		return y > y0;

	if (x < x1)
		return y > a * (x - x0) + y0;

	return weight > x / Math.log(x) - x1 / Math.log(x1) + y1;
}

function inPlacement1(wordsCount, weight) {
	return inTheme(wordsCount, weight * 30);
}

function inPlacement2(wordsCount, weight) {
	//if (inPlacement1(wordsCount, weight))
	//	return false;
	return inTheme(wordsCount, weight * 45);
}

function inPlacement3(wordsCount, weight) {
	//if (inPlacement1(wordsCount, weight) || inPlacement2(wordsCount, weight))
	//	return false;
	return inTheme(wordsCount, weight * 60);
}
var firstPlace = [],
	secondPlace = [],
	thirdPlace = [];

function sendWords() {
	var str = '';
	for (var i = 0; i < allPosts.length; i++) {
		str += allPosts[i].text + ' ';
	}
	$.ajax({
		url: "/Home/TextAnalisys",
		type: "POST",
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify({ text: str }),
		success: function (data) {
			var wordsCount = wallWords.length;
			var d = data[0];
			for (var theme in d) {
				if (theme === 'tp')
					continue;
				if (inPlacement1(wordsCount, d[theme])) {
					firstPlace.push(toNormalTitle(theme));
				}
				else if (inPlacement2(wordsCount, d[theme])) {
					secondPlace.push(toNormalTitle(theme));
				}
				else if (inPlacement3(wordsCount, d[theme])) {
					thirdPlace.push(toNormalTitle(theme));
				}
			}
			renderSmallAndBigChart($('#hobbies-chart'));

		}
	});
}

var hobbies_chart;
function renderHobbies(posts) {
	var temp = [];
	for (var p in posts) {
		if (posts[p].text != "")
			temp.push({ ID: posts[p].id, Text: posts[p].text });
	}
	$.ajax({
		url: "/Home/Analisys",
		type: "POST",
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify({ posts: temp }),
		success: function (data) {
			var max = {};
			var sum = {};
			var min = {};
			for (var i in data) {
				for (var j in data[i].Info) {
					if (j != "tp")
						if (max[j]) {
							if (max[j] < data[i].Info[j])
								max[j] = data[i].Info[j];
						}
						else
							max[j] = data[i].Info[j];
					if (sum[j]) {
						sum[j] += data[i].Info[j];
					}
					else
						sum[j] = data[i].Info[j];
				}
			}
			var sumStat = 0;
			for (var p in sum)
				if (p != "tp")
					sumStat += sum[p];
			var chartData = [];
			var axis = {};
			axis.categories = [];
			axis.title = { text: "" };
			axis.labels = { enabled: false };
			//for (var p in sum) {
			//	if (p != "tp" && sum[p] > 0) {
			//		chartData.push({ name: toNormalTitle(p), data: [y = parseFloat((sum[p] * 100 / sumStat).toFixed(2))] });
			//	}
			//}
			var linksOfTheme = []
			var tabOfTheme = []
			first = true

			for (var i in data) {
				for (var j in data[i].Info) {
					var p = getPostbyID(posts, data[i].ID);
					if (j != "tp" && inTheme(p.text.split(/\s+|<br>|,|\.|!|;|\)|\(|\:|\?|\-/).length, data[i].Info[j])) {
						//                    if (j != "tp" && data[i].Info[j] >= 0.6 * max[j] && data[i].Info[j] * 100.0 / Math.max(p.text.length, 100.0) > 1.5) {
						var link = "http://vk.com/wall" + p.to_id + '_' + p.id;
						if (linksOfTheme[toNormalTitle(j)]) {
							linksOfTheme[toNormalTitle(j)].push('<div class="text-wall">' + p.text.cut() + '<a href="' + link + '" target="_blank" >  прочитать</a></div>')
						}
						else {
							linksOfTheme[toNormalTitle(j)] = [];
							linksOfTheme[toNormalTitle(j)].push('<div class="text-wall">' + p.text.cut() + '<a href="' + link + '" target="_blank" >  прочитать</a></div>')
							if (first) {
								tabOfTheme[toNormalTitle(j)] = '<li><a href="#" class="active"><i class="icon-chevron-right"></i>' + toNormalTitle(j) + '</a></li>';
								first = false;
							}
							else
								tabOfTheme[toNormalTitle(j)] = '<li><a href="#"><i class="icon-chevron-right"></i>' + toNormalTitle(j) + '</a></li>'
						}
					}
				}
			}
			for (var l in linksOfTheme) {
				$template = $(tabOfTheme[l])
				$template.click(function (item) {
					$('.active', $(this).parent()).removeClass('active')
					$(this).addClass('active')
					$('.links').empty()
					for (var link in linksOfTheme[$(this).text()]) {
						$('.links').append($(linksOfTheme[$(this).text()][link]))
					}
					return false;
				});
				$('#hobbies-tab').after($template);
			}
			$($('#chart-navigation li:not(.nav-header)')[0]).click();
			var tempMass = [];
			for (var i in sum)
				if (i != "tp" && sum[i] > 0.3)
					tempMass.push(i);

			if (sumStat > 0 && tempMass.length > 0) {
				chartData.sort(function (a, b) {
					return b.data[0] - a.data[0];
				});
			}
			else
				if (getCookie("lang") == "en")
					$('#hobbies-tab').after($("<p>Do you have too few posts, to determine your hobbies.</p>"));
				else {
					$('#hobbies-chart').empty();
					$('#hobbies-chart').append($("<p>У Вас слишком мало постов, чтобы определить Ваши увлечения.</p>"));
				}
		}
	});
};
function renderFriendInfo(mas) {
	var universities = groupby(mas, "university_name", mas.length);
	var ages = groupby(mas, "bdate", mas.length, false, function (x) {
		var str = x.split('.');
		if (str.length < 3)
			return "";
		var date = new Date(parseInt(str[2]), parseInt(str[0]), parseInt(str[1]));
		var curDate = new Date();
		return (curDate.getFullYear() - date.getFullYear());
	});
	var model = [];
	for (var i = 0; i < universities.length; i++) {
		model.push({ rank: i + 1, universityName: universities[i].name, friendsCount: universities[i].value });
	}
	saveDataToMongoDB(JSON.stringify(model), 'UnversityRating');
	ko.applyBindings(new UniversityRatingModel(model), $('#top-universities')[0]);
	$('#top-universities .form-actions').show();
	var sex_dictionary = { 0: "Не указан", 1: "Женский", 2: "Мужской" }
	var sex_percentage = groupby(mas, "sex", 2);
	var sex_first_value = sex_percentage[0] ? sex_percentage[0].value : 0;
	var sex_first_name = sex_percentage[0] ? sex_percentage[0].name : "";
	var sex_second_value = sex_percentage[1] ? sex_percentage[1].value : 0;
	var sex_second_name = sex_percentage[1] ? sex_percentage[1].name : "";
	var sex_total = sex_first_value + sex_second_value;
	if (sex_first_value < sex_second_value) {
		var t_value = sex_first_value;
		var t_name = sex_first_name;
		sex_first_value = sex_second_value;
		sex_first_name = sex_second_name;
		sex_second_value = t_value;
		sex_second_name = t_name;
	}
	var sex_percentage_chart;
	var chartData = [];
	if (sex_first_value != 0) {
		chartData.push({ name: sex_dictionary[sex_first_name], y: parseFloat(sex_first_value) });
	}
	if (sex_second_value != 0) {
		chartData.push({ name: sex_dictionary[sex_second_name], y: sex_second_value });
	}
	sex_percentage_chart = new Highcharts.Chart({
		chart: {
			renderTo: 'sex-percentage-chart',
			type: 'pie'
		},
		title: {
			text: " "
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: 'pointer'
			}
		},
		series: [{
			name: 'Количество',
			data: chartData
		}],
		credits: { enabled: false }
	});
}

function getFriends() {
	var fields = "fields=sex,bdate,city,education";
	var uid = user_id ? user_id.replace('owner_id=', 'uid=') : "";
	$.ajax({
		url: "https://api.vk.com/method/friends.get?" + access_token + uid + "&" + fields,
		dataType: "jsonp",
		success: function (data) {
			var cities = groupby(data.response, "city", data.response.length)
			renderCities(cities);
			saveDataToMongoDB(JSON.stringify(data.response), 'Friends');
			renderFriendInfo(data.response);
		}
	});
};

function renderCities(mas) {
	var req = "";
	for (var i = 0; i < mas.length; i++) {
		req += mas[i].name;
		if (i != mas.length - 1) {
			req += ",";
		}
	}
	var model = [];
	$.ajax({
		url: "https://api.vk.com/method/getCities?cids=" + req + "&api_id=" + app.appId,
		dataType: "jsonp",
		success: function (data) {
			for (var i = 0; i < mas.length; i++) {
				for (var j = 0; j < data.response.length; j++) {
					if (data.response[j].cid == mas[i].name.toString()) {
						model.push({ rank: i + 1, cityName: data.response[j].name, friendsCount: mas[i].value });
						break;
					}
				}
			}
			saveDataToMongoDB(JSON.stringify(model), 'CityRating');
			ko.applyBindings(new CityRatingModel(model), $('#top-cities')[0]);
			$('#top-cities .form-actions').show();
		}
	});
}

function renderUsersInfo(usersDict) {
	var model = [];
	var usersArray = [];
	var usersDictKeys = Object.keys(usersDict);
	var userIds = "";
	for (var i = 0; i < usersDictKeys.length; i++) {
		usersArray.push([usersDictKeys[i], usersDict[usersDictKeys[i]].liked.length]);
	}
	usersArray.sort(function (a, b) {
		return b[1] - a[1];
	});
	usersArray = usersArray.slice(0, 12);
	for (var i = 0; i < usersArray.length; i++) {
		userIds += usersArray[i][0] + ",";
	}
	$.ajax({
		url: "https://api.vk.com/method/users.get?uids=" + userIds + "&fields=uid,photo_big",
		dataType: "jsonp",
		success: function (data) {
			if (!data.error) {
				for (var i = 0; i < data.response.length; i++) {
					model.push({
						rank: 0,
						user: data.response[i],
						liked: usersDict[data.response[i].uid].liked.map(function (item) {
							return {
								content: {
									to_id: item.content.to_id,
									id: item.content.id,
									pid: item.content.pid,
									owner_id: item.content.owner_id
								},
								type: item.type
							}
						}),
						reposts: usersDict[data.response[i].uid].reposts.map(function (item) {
							return {
								content: {
									to_id: item.content.to_id,
									id: item.content.id,
									pid: item.content.pid,
									owner_id: item.content.owner_id
								},
								type: item.type
							}
						}),
					});
				}
			}
			for (var k = 0; k < model.length; k++) {
				model[k].rank = (k + 1).toString();
			}
			saveDataToMongoDB(JSON.stringify(model), 'LikedMeUsers');
			ko.applyBindings(new LikedMeRatingModel(model), $('#top-liked-me-users')[0]);
			$('#likedme-rating, #top-liked-me-users .form-actions').show();
			dataLoaded();
		}
	});
}

function getFavouritePosts(offset, outputUsers, outputGroups, pidArray) {
	$.ajax({
		url: "https://api.vk.com/method/fave.getPosts?" + access_token + "&count=100" + "&offset=" + offset,
		dataType: "jsonp",
		success: function (data) {
			if (data && data.response.length > 0 && offset < data.response[0]) {
				for (var i = 1; i < data.response.length; i++) {
					if (!data.response[i].copy_owner_id) {
						if (data.response[i].from_id > 0) {
							if (outputUsers[data.response[i].from_id]) {
								outputUsers[data.response[i].from_id].content.push({ content: data.response[i], type: 'post' });
							}
							else {
								outputUsers[data.response[i].from_id] = { content: [] };
								outputUsers[data.response[i].from_id].content.push({ content: data.response[i], type: 'post' });
							}
						}
						else {
							if (outputGroups[0 - data.response[i].from_id]) {
								outputGroups[0 - data.response[i].from_id].content.push({ content: data.response[i], type: 'post' });
							}
							else {
								outputGroups[0 - data.response[i].from_id] = { content: [] };
								outputGroups[0 - data.response[i].from_id].content.push({ content: data.response[i], type: 'post' });
							}
						}
						if (data.response[i].attachment && data.response[i].attachment.photo) {
							pidArray.push(data.response[i].attachment.photo.pid);
						}
					}
					else {
						if (data.response[i].copy_owner_id > 0) {
							if (outputUsers[data.response[i].copy_owner_id]) {
								outputUsers[data.response[i].copy_owner_id].content.push({ content: data.response[i], type: 'post' });
							}
							else {
								outputUsers[data.response[i].copy_owner_id] = { content: [] };
								outputUsers[data.response[i].copy_owner_id].content.push({ content: data.response[i], type: 'post' });
							}
						}
						else {
							if (outputGroups[0 - data.response[i].copy_owner_id]) {
								outputGroups[0 - data.response[i].copy_owner_id].content.push({ content: data.response[i], type: 'post' });
							}
							else {
								outputGroups[0 - data.response[i].copy_owner_id] = { content: [] };
								outputGroups[0 - data.response[i].copy_owner_id].content.push({ content: data.response[i], type: 'post' });
							}
						}
					}
				}
				getFavouritePosts(offset + 100, outputUsers, outputGroups, pidArray);
			}
			else {
				getFavouritePhotos(0, outputUsers, outputGroups, pidArray)
			}
		}
	});
}

function getFavouritePhotos(offset, outputUsers, outputGroups, pidArray) {
	$.ajax({
		url: "https://api.vk.com/method/fave.getPhotos?" + access_token + "&count=100" + "&offset=" + offset,
		dataType: "jsonp",
		success: function (data) {
			if (data && data.response.length > 0 && offset < data.response[0]) {
				for (var i = 1; i < data.response.length; i++) {
					if ($.inArray(data.response[i].pid, pidArray) === -1) {
						if (data.response[i].owner_id > 0) {
							if (outputUsers[data.response[i].owner_id]) {
								outputUsers[data.response[i].owner_id].content.push({ content: data.response[i], type: 'photo' });
							}
							else {
								outputUsers[data.response[i].owner_id] = { content: [] };
								outputUsers[data.response[i].owner_id].content.push({ content: data.response[i], type: 'photo' });
							}
						}
						if (data.response[i].owner_id < 0) {
							if (outputGroups[0 - data.response[i].owner_id]) {
								outputGroups[0 - data.response[i].owner_id].content.push({ content: data.response[i], type: 'photo' });
							}
							else {
								outputGroups[0 - data.response[i].owner_id] = { content: [] };
								outputGroups[0 - data.response[i].owner_id].content.push({ content: data.response[i], type: 'photo' });
							}
						}
					}
				}
				getFavouritePhotos(offset + 100, outputUsers, outputGroups, pidArray);
			}
			else {
				getFavouriteVideos(0, outputUsers, outputGroups);
			}
		}
	});
}

function getFavouriteVideos(offset, outputUsers, outputGroups) {
	$.ajax({
		url: "https://api.vk.com/method/fave.getVideos?" + access_token + "&count=100" + "&offset=" + offset,
		dataType: "jsonp",
		success: function (data) {
			if (data && data.response.length > 0 && offset < data.response[0]) {
				for (var i = 1; i < data.response.length; i++) {
					if (data.response[i].owner_id > 0) {
						if (outputUsers[data.response[i].owner_id]) {
							outputUsers[data.response[i].owner_id].content.push({ content: data.response[i], type: 'video' });
						}
						else {
							outputUsers[data.response[i].owner_id] = { content: [] };
							outputUsers[data.response[i].owner_id].content.push({ content: data.response[i], type: 'video' });
						}
					}
					if (data.response[i].owner_id < 0) {
						if (outputGroups[0 - data.response[i].owner_id]) {
							outputGroups[0 - data.response[i].owner_id].content.push({ content: data.response[i], type: 'video' });
						}
						else {
							outputGroups[0 - data.response[i].owner_id] = { content: [] };
							outputGroups[0 - data.response[i].owner_id].content.push({ content: data.response[i], type: 'video' });
						}
					}
				}
				getFavouriteVideos(offset + 100, outputUsers, outputGroups);
			}
			else {
				renderFavouritesRating(outputUsers, outputGroups);
			}
		}
	});
}

function getFavourites() {
	getFavouritePosts(0, favouriteUsers, favouriteGroups, []);
};

function renderFavouritesRating(users, groups) {
	var reqGroups = "";
	for (var i = 0; i < Object.keys(groups).length; i++) {
		reqGroups += Object.keys(groups)[i];
		if (i != Object.keys(groups).length - 1) {
			reqGroups += ",";
		}
	}
	var modelGroups = [];
	$.ajax({
		url: "https://api.vk.com/method/groups.getById?" + access_token + "&gids=" + reqGroups + "&fields=photo_big",
		dataType: "jsonp",
		success: function (data) {
			if (reqGroups) {
				for (var i = 0; i < data.response.length; i++) {
					modelGroups.push({ rank: 0, group: data.response[i], content: groups[data.response[i].gid].content });
				}
				modelGroups.sort(function (a, b) {
					return b.content.length - a.content.length;
				});
				for (var i = 0; i < Object.keys(groups).length; i++) {
					modelGroups[i].rank = (i + 1).toString();
				}
			}
			modelGroups = modelGroups.slice(0, 12);
			saveDataToMongoDB(JSON.stringify(modelGroups), 'FavouriteGroups');
			ko.applyBindings(new FavouriteGroupsRatingModel(modelGroups), $('#top-liked-pages')[0]);
			$('#favourite-groups-rating, #top-liked-pages .form-actions').show();
		}
	});
	var reqUsers = "";
	for (var i = 0; i < Object.keys(users).length; i++) {
		reqUsers += Object.keys(users)[i];
		if (i != Object.keys(users).length - 1) {
			reqUsers += ",";
		}
	}
	var modelUsers = [];
	$.ajax({
		url: "https://api.vk.com/method/users.get?" + access_token + "&uids=" + reqUsers + "&fields=photo_big",
		dataType: "jsonp",
		success: function (data) {
			if (reqUsers) {
				for (var i = 0; i < Object.keys(users).length; i++) {
					modelUsers.push({ rank: 0, user: data.response[i], content: users[data.response[i].uid].content });
				}
				modelUsers.sort(function (a, b) {
					return b.content.length - a.content.length;
				});
				for (var i = 0; i < Object.keys(users).length; i++) {
					modelUsers[i].rank = (i + 1).toString();
				}
			}
			modelUsers = modelUsers.slice(0, 12);
			saveDataToMongoDB(JSON.stringify(modelUsers), 'FavouriteUsers');
			ko.applyBindings(new FavouriteUsersRatingModel(modelUsers), $('#top-liked-users')[0]);
			$('#favourite-users-rating, #top-liked-users .form-actions').show();
		}
	});
}

function renderContentRating(contentType) {
	var model = [];
	for (var k = 0; k < likedContent.length; k++) {
		if (likedContent[k].type === contentType) {
			var index = model.push({
				rank: 0,
				content: {
					owner_id: likedContent[k].content.owner_id,
					pid: likedContent[k].content.pid,
					to_id: likedContent[k].content.to_id,
					id: likedContent[k].content.id,
					src_big: likedContent[k].content.src_big,
					likes: likedContent[k].content.likes,
					reposts: likedContent[k].content.reposts,
					attachments: likedContent[k].content.attachments,
					text: likedContent[k].content.text,
					liked: likedContent[k].liked,
					reposted: likedContent[k].reposted
				}
			}) - 1;
		}
	}
	model.sort(function (a, b) {
		return b.content.likes.count - a.content.likes.count;
	});
	model = model.slice(0, 12);
	for (var i = 0; i < model.length; i++) {
		model[i].rank = (i + 1).toString();
	}
	if (contentType === 'photo') {
		saveDataToMongoDB(JSON.stringify(model), 'PopularPhotos');
		ko.applyBindings(new PhotoRatingModel(model), $('#most-liked-photo')[0]);
		$('#likedphotos-rating, #most-liked-photo .form-actions').show();
	}
	if (contentType === 'post') {
		saveDataToMongoDB(JSON.stringify(model), 'PopularPosts');
		ko.applyBindings(new PostRatingModel(model), $('#most-liked-post')[0]);
		$('#likedposts-rating, #most-liked-post .form-actions').show();
	}
}

function renderPostsAndLikesByMonthsGraph(likedContent) {
	if (likedContent && likedContent.length != 0) {
		var months = ['Зима', 'Зима', 'Весна', 'Весна', 'Весна', 'Лето', 'Лето', 'Лето', 'Осень', 'Осень', 'Осень', 'Зима'];
		for (var i in likedContent) {
			if (likedContent[i].created) {
				likedContent[i].date = likedContent[i].created;
			}
		}
		likedContent.sort(function (a, b) {
			return b.date - a.date;
		});
		var startdate = likedContent[likedContent.length - 1].date;
		var enddate = Date.now();
		var dates = {};
		var orderedSeasons = [];
		var seasonIndex = 0;
		startdate = new Date(startdate * 1000);
		enddate = new Date(enddate);
		switch (enddate.getMonth()) {
			case 0:
			case 1: {
				enddate.setMonth(1);
				break;
			}
			case 11: {
				enddate.setMonth(enddate.getMonth() + 1);
				break;
			}
			case 2:
			case 3:
			case 4: {
				enddate.setMonth(4);
				break;
			}
			case 5:
			case 6:
			case 7: {
				enddate.setMonth(7);
				break;
			}
			case 8:
			case 9:
			case 10: {
				enddate.setMonth(10);
				break;
			}
		}
		enddate.setDate(0);
		while (startdate <= enddate) {
			var season = "";
			switch (startdate.getMonth()) {
				case 0:
				case 1:
					{
						season = months[startdate.getMonth()] + " " + (startdate.getFullYear() - 1).toString() + "-" + startdate.getFullYear();
						dates[seasonIndex] = 0;
						break;
					}
				case 11:
					{
						season = months[startdate.getMonth()] + " " + startdate.getFullYear() + "-" + (startdate.getFullYear() + 1).toString()
						dates[seasonIndex] = 0;
						break;
					}
				default:
					{
						season = months[startdate.getMonth()] + " " + startdate.getFullYear()
						dates[seasonIndex] = 0;
						break;
					}
			}
			if ($.inArray(season, orderedSeasons) === -1) {
				seasonIndex = orderedSeasons.push(season) - 1;
			}
			startdate.setMonth(startdate.getMonth() + 1);
		}
		for (var i = 0; i < likedContent.length; i++) {
			var l = likedContent[i].likes ? likedContent[i].likes.count : likedContent[i].liked.length;
			var date = new Date(likedContent[i].date * 1000);
			switch (date.getMonth()) {
				case 0:
				case 1:
					{
						dates[$.inArray(months[date.getMonth()] + " " + (date.getFullYear() - 1).toString() + "-" + date.getFullYear(), orderedSeasons)] += l;
						break;
					}
				case 11:
					{
						dates[$.inArray(months[date.getMonth()] + " " + date.getFullYear() + "-" + (date.getFullYear() + 1).toString(), orderedSeasons)] += l;
						break;
					}
				default:
					{
						dates[$.inArray(months[date.getMonth()] + " " + date.getFullYear(), orderedSeasons)] += l;
						break;
					}
			}
		}
		var maxLikes = { date: orderedSeasons[0], count: dates[0] };
		var minLikes = dates[0];
		chartSeriesLikes = [];
		for (var i in dates) {
			chartSeriesLikes.push(dates[i]);
			if (dates[i] > maxLikes.count) {
				maxLikes.count = dates[i];
				maxLikes.date = orderedSeasons[i];
			};
			minLikes = dates[i] < minLikes ? dates[i] : minLikes;
		}
		if (chartSeriesLikes.length === 0) {
			return false;
		}

		$('#posts-by-month-chart').empty();

		var plotBands = [{ // Light air
			from: 0,
			to: 100,
			color: 'rgba(0, 0, 0, 0)',
			label: {
				text: 'Низкая популярность',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		}, { // Light breeze
			from: 100,
			to: 200,
			color: 'rgba(143, 0, 255, 0.3)',
			label: {
				text: 'Обычная популярность',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		}, { // Gentle breeze
			from: 200,
			to: 500,
			color: 'rgba(111, 0, 255, 0.2)',
			label: {
				text: 'Интересный человек',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		}, { // Moderate breeze
			from: 500,
			to: 1000,
			color: 'rgba(0, 0, 255, 0.3)',
			label: {
				text: 'Популярный человек',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		}, { // Fresh breeze
			from: 1000,
			to: 5000,
			color: 'rgba(0, 255, 0, 0.2)',
			label: {
				text: 'Восходящая звезда',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		}, { // Strong breeze
			from: 5000,
			to: 10000,
			color: 'rgba(255, 255, 0, 0.3)',
			label: {
				text: 'Звезда',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		}, { // High wind
			from: 10000,
			to: 30000,
			color: 'rgba(255, 127, 0, 0.2)',
			label: {
				text: 'Суперзвезда',
				style: {
					color: '#606060',
					display: 'none'
				}
			},
			zIndex: 4
		},
				{ // High wind
					from: 30000,
					to: Infinity,
					color: 'rgba(255, 0, 0, 0.3)',
					label: {
						text: 'Всем известный человек',
						style: {
							color: '#606060',
							display: 'none'
						}
					},
					zIndex: 4
				}]
		var conclusion = "";
		for (var i in plotBands) {
			if (maxLikes.count < plotBands[i].to) {
				if (i == 0 || i == 1) {
					conclusion = "У пользователя " + plotBands[i].label.text.toLocaleLowerCase();
				}
				else {
					conclusion = "Скорее всего, пользователь - " + plotBands[i].label.text.toLowerCase();
				}
				break;
			}
		}
		$('#likes-comment').append('<p>' + conclusion + '</p>');
		$('#likes-comment').append('<p>Самое большое количество лайков: ' + maxLikes.date + ' (' + maxLikes.count + ')</p>');
		var filterLevel = maxLikes.count / 10;
		for (var i = plotBands.length - 1; i >= 0 ; i--) {
			if (plotBands[i].to <= filterLevel) {
				plotBands = plotBands.slice(i + 1);
				break;
			}
		}
		postsAndLikesChart = new Highcharts.Chart({
			chart: {
				renderTo: 'chart-container-invisible',
				width: 150,
				height: 150,
				type: 'spline'
			},
			tooltip: {
				crosshairs: true,
				shared: true
			},
			legend: { enabled: false },
			plotOptions: {
				spline: {
					lineWidth: 4,
					states: {
						hover: {
							lineWidth: 5
						}
					},
					marker: {
						enabled: true,
						states: {
							hover: {
								enabled: true,
								symbol: 'circle',
								radius: 5,
								lineWidth: 1
							}
						}
					}
				}
			},
			xAxis: { categories: orderedSeasons, labels: { enabled: false } },
			yAxis: {
				title: '',
				min: 0,
				offset: 5,
				plotBands: plotBands
			},
			title: {
				text: "Лайки"
			},
			series: [{
				name: 'Лайки',
				data: chartSeriesLikes
			}],
			credits: { enabled: false }
		});
		var svg = getSVG([postsAndLikesChart]);
		$('#posts-by-month-chart').append($(svg));
	}
}

function groupby(data, property, topCount, nosort, handler) {
	var mas = {};
	if (property) {
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			var cur = item[property];
			if (cur && cur != "0") {
				cur = handler ? handler(cur) : cur;
				if (cur && cur != "0") {
					if (mas[cur]) {
						mas[cur]++;
					}
					else {
						mas[cur] = 1;
					}
				}
			}
		}
	}
	else {
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			if (item) {
				if (mas[item]) {
					mas[item]++;
				}
				else {
					mas[item] = 1;
				}
			}
		}
	}
	var output = [];
	for (p in mas) {
		output.push({ name: p, value: mas[p] });
	}
	if (!nosort) {
		output.sort(function (a, b) {
			return b.value - a.value;
		});
	}
	return output.slice(0, topCount);
};

function getWhoLikedPosts() {
	var counter = 0;
	for (var i = 0; i < likedContent.length; i++) { //&& i < 1000
		$.ajax({
			url: "https://api.vk.com/method/likes.getList?type=post&filter=likes&count=1000&item_id=" + likedContent[i].content.id + user_id + "&" + access_token,
			beforeSend: function () {
				$(this).data('index', i);
			},
			data: { item_id: likedContent[i].content.id },
			dataType: "jsonp",
			success: function (data) {
				likedContent[$(this).data('index')].liked = data.response.users;
				if (data.response && data.response.count > 1000) {
					showErrorBar = true;
				}
				for (var j = 0; j < data.response.count && j < 1000; j++) {
					if (likedMeUsers[data.response.users[j]]) {
						likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
					}
					else {
						if (data.response.users[j] > 0) {
							likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
							likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
						}
					}
				}
				if (counter === likedContent.length - 1) {
					getWhoRepostedPosts();
				}
				counter++;
			}
		});
	}
}

function getWhoRepostedPosts() {
	var counter = 0;
	for (var i = 0; i < likedContent.length; i++) { //&& i < 1000
		$.ajax({
			url: "https://api.vk.com/method/likes.getList?type=post&filter=copies&count=1000&item_id=" + likedContent[i].content.id + user_id + "&" + access_token,
			beforeSend: function () {
				$(this).data('index', i);
			},
			dataType: "jsonp",
			success: function (data) {
				if (data.response.count > 0) {
					likedContent[$(this).data('index')].reposted = data.response.users;
				}
				if (data.response && data.response.count > 1000) {
					showErrorBar = true;
				}
				for (var j = 0; j < data.response.count && j < 1000; j++) {
					if (likedMeUsers[data.response.users[j]]) {
						likedMeUsers[data.response.users[j]].reposts.push(likedContent[$(this).data('index')]);
					}
					else {
						if (data.response.users[j] > 0) {
							likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
							likedMeUsers[data.response.users[j]].reposts.push(likedContent[$(this).data('index')]);
						}
					}
				}
				if (counter === likedContent.length - 1) {
					renderContentRating('post');
					getLikedPhotos([], 0);
				}
				counter++;
			}
		});
	}
}

function getLikedPhotos(mas, offset) {
	$.ajax({
		url: "https://api.vk.com/method/photos.getAll?" + access_token + user_id + "&offset=" + offset + "&count=100&extended=1",
		dataType: "jsonp",
		success: function (data) {
			if (data && data.response.length > 0 && offset < data.response[0] && data.response[0] > 0) {
				for (var i = 1; i < data.response.length; i++) {
					if (data.response[i].likes.count > 0) {
						likedContent.push({ content: data.response[i], type: 'photo' });
					}
				}
				getLikedPhotos(mas, offset + 100);
			}
			else {
				if (likedContent.length == 0) {
					renderContentRating('photo');
					getLikedVideos([], 0);
				}
				else {
					renderContentRating('photo');
					getWhoLikedPhoto();
				}
			}
		}
	});
}

function getWhoLikedPhoto() {
	var counter = 0;
	var length = likedContent.length;
	for (var i = 0; i < length; i++) {
		$.ajax({
			url: "https://api.vk.com/method/likes.getList?filter=likes&type=photo&count=1000&item_id=" + likedContent[i].content.pid + user_id + "&" + access_token,
			dataType: "jsonp",
			beforeSend: function () {
				$(this).data('index', i);
			},
			success: function (data) {
				if (!data.error) {
					if (data.response && data.response.count > 1000) {
						showErrorBar = true;
					}
					likedContent[$(this).data('index')].liked = data.response.users;
					for (var j = 0; j < data.response.count && j < 1000; j++) {
						if (likedMeUsers[data.response.users[j]]) {
							likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
						}
						else {
							if (data.response.users[j] > 0) {
								likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
								likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
							}
						}
					}
				}
				if (counter === length - 1) {
					getLikedVideos([], 0);
				}
				counter++;
			}
		});
	}
}

function getLikedVideos(mas, offset) {//, likedData) {
	var a = 5;
	$.ajax({
		url: "https://api.vk.com/method/video.get?" + access_token + "&offset=" + offset + user_id + "&count=200",
		dataType: "jsonp",
		type: "post",
		success: function (data) {
			if (data && data.response.length > 0 && offset < data.response[0] && data.response[0] > 0) {
				for (var i = 1; i < data.response.length; i++) {
					mas.push(data.response[i]);
				}
				getLikedVideos(mas, offset + 100);
			}
			else {
				if (mas.length === 0) {
					renderPostsAndLikesByMonthsGraph(likedContent);
					renderUsersInfo(likedMeUsers);
				}
				else {
					getWhoLikedVideo(mas);
				}
			}
		}
	});
}

function getWhoLikedVideo(mas) {
	var counter = 0;
	for (var i = 0; i < mas.length; i++) {
		$.ajax({
			url: "https://api.vk.com/method/likes.getList?type=video&filter=likes&count=1000&item_id=" + mas[i].vid + user_id + "&" + access_token,
			beforeSend: function () {
				$(this).data('index', i);
			},
			dataType: "jsonp",
			success: function (data) {
				if (data.response && data.response.count > 1000) {
					showErrorBar = true;
				}
				if (data.response.count > 0) { likedContent.push({ content: mas[$(this).data('index')], type: 'video', liked: data.response.users, reposted: [] }); }
				for (var j = 0; j < data.response.count && j < 1000; j++) {
					if (likedMeUsers[data.response.users[j]]) {
						likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
					}
					else {
						likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
						likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
					}
				}
				if (counter === mas.length - 1) {
					var mappedLikedContent = likedContent.map(function (item) {
						return {
							likes: item.content.likes,
							liked: item.liked,
							date: item.content.date,
							created: item.content.created
						}
					});
					saveDataToMongoDB(JSON.stringify(mappedLikedContent), 'LikedContent');
					renderPostsAndLikesByMonthsGraph(mappedLikedContent);
					renderUsersInfo(likedMeUsers);
				}
				counter++;
			}
		});
	}
}

likedMeRatingModal = function (item) {
	$($('#likedme-rating .modal')[item.rank() - 1]).modal('toggle');
}

favouriteUsersRatingModal = function (item) {
	$($('#favourite-users-rating .modal')[item.rank() - 1]).modal('toggle');
}

favouriteGroupsRatingModal = function (item) {
	$($('#favourite-groups-rating .modal')[item.rank() - 1]).modal('toggle');
}

function LikedMeRating(data) {
	this.rank = ko.observable(data.rank);
	this.link = ko.computed(function () {
		return "http://vk.com/id" + data.user.uid;
	}, this);
	this.username = ko.computed(function () {
		return data.user.first_name + " " + data.user.last_name;
	}, this);
	this.photo = ko.observable(data.user.photo_big);
	this.likedContentList = ko.observableArray([]);
	var mappedlikedContent = $.map(data.liked, function (item) {
		var result = { link: "", displayed: "" };
		switch (item.type) {
			case "photo":
				{
					result.link += "http://vk.com/id" + item.content.owner_id + "?z=photo" + item.content.owner_id + "_" + item.content.pid;
					break
				}
			case "post":
				{
					result.link += "http://vk.com/wall" + item.content.to_id + "_" + item.content.id;
					break
				}
		}
		return result;
	});
	this.likedContentList(mappedlikedContent);
	this.repostedContentList = ko.observableArray([]);
	var mappedrepostedContent = $.map(data.reposts, function (item) {
		var result = { link: "" };
		switch (item.type) {
			case "photo": { result.link += "http://vk.com/id" + item.content.owner_id + "?z=photo" + item.content.owner_id + "_" + item.content.pid; break }
			case "post": { result.link += "http://vk.com/wall" + item.content.to_id + "_" + item.content.id; break }
		}
		return result;
	});
	this.repostedContentList(mappedrepostedContent);
	this.likesCount = ko.observable(data.liked.length);
	this.repostsCount = ko.observable(data.reposts.length);
	this.analyzeUser = function () {
		setOwnerId(data.user.uid);
	}
}

function LikedMeRatingModel(model) {
	var self = this;
	self.currentLength = ko.observable(4);
	self.showedLikedMe = ko.observableArray([]);
	var mappedLikedMe = $.map(model, function (item) { return new LikedMeRating(item) });
	self.maxLength = ko.observable(mappedLikedMe.length);
	self.showedLikedMe(mappedLikedMe.slice(0, self.currentLength()));
	self.expand = function () {
		self.currentLength(self.currentLength() + 4);
		self.showedLikedMe(mappedLikedMe.slice(0, self.currentLength()));
	};
	self.collapse = function () {
		self.currentLength(4);
		self.showedLikedMe(mappedLikedMe.slice(0, self.currentLength()));
	};
	ShowErrorBar();
}

function PhotoRating(data) {
	this.rank = ko.observable(data.rank);
	this.link = ko.computed(function () {
		return "http://vk.com/id" + data.content.owner_id + "?z=photo" + data.content.owner_id + "_" + data.content.pid;
	}, this);
	this.source = ko.observable(data.content.src_big);
	this.likesCount = ko.observable(data.content.likes.count);
}

function PhotoRatingModel(model) {
	var self = this;
	self.currentLength = ko.observable(4);
	self.showedLikedPhotos = ko.observableArray([]);
	var mappedlikedPhotos = $.map(model, function (item) { return new PhotoRating(item) });
	self.maxLength = ko.observable(mappedlikedPhotos.length);
	self.showedLikedPhotos(mappedlikedPhotos.slice(0, self.currentLength()));
	self.expand = function () {
		self.currentLength(this.currentLength() + 4);
		self.showedLikedPhotos(mappedlikedPhotos.slice(0, self.currentLength()));
	};
	self.collapse = function () {
		self.currentLength(4);
		self.showedLikedPhotos(mappedlikedPhotos.slice(0, self.currentLength()));
	};
	ShowErrorBar();
}

function PostRating(data) {
	this.rank = ko.observable(data.rank);
	this.likesCount = ko.observable(data.content.likes.count);
	this.repostsCount = ko.observable(data.content.reposts.count);
	this.link = ko.computed(function () {
		return "http://vk.com/wall" + data.content.to_id + "_" + data.content.id;
	}, this);
	this.picsrc = ko.observable();
	this.displayed = ko.computed(function () {
		var result = "";
		if (data.content.attachments) {
			switch (data.content.attachments[0].type) {
				case "photo":
					{
						this.picsrc(data.content.attachments[0].photo.src_big);
						break
					}
				case "posted_photo":
					{
						this.picsrc(data.content.attachments[0].posted_photo.src_big);
						break
					}
				case "link":
					{
						result += data.content.attachments[0].link.title; //картинка
						this.picsrc("/content/images/1341926477_emblem-symbolic-link.png");
						break
					}
				case "video":
					{
						result += data.content.attachments[0].video.title; //картинка
						this.picsrc("/content/images/avi-icon.png");
						break
					}
				case "audio":
					{
						result += data.content.attachments[0].audio.performer + " - " + data.content.attachments[0].audio.title; //img
						this.picsrc("/content/images/1341926136_Music-Itunes.png");
						break
					}
				case "doc":
					{
						result += data.content.attachments[0].doc.title; //img
						this.picsrc("/content/images/1341923912_onebit_39.png");
						break
					}
				case "graffiti": //img
					{
						this.picsrc(data.content.attachments[0].graffiti.src_big);
						break
					}
				case "app": //img
					{
						this.picsrc(data.content.attachments[0].app.src_big);
						break
					}
				case "poll": //img
					{
						result += data.content.attachments[0].poll.question;
						this.picsrc("/content/images/1341923929_poll.png");
						break
					}
				case "note": //img
					{
						result += data.content.attachments[0].note.title;
						this.picsrc("/content/images/1341923983_Notes.png");
						break
					}
			}
		}
		else {
			this.picsrc("/content/images/1341923983_Notes.png");
		}
		result += data.content.text;
		return result.cut();

	}, this);
}

function PostRatingModel(model) {
	var self = this;
	self.showedLikedPosts = ko.observableArray([]);
	self.currentLength = ko.observable(4);
	var mappedlikedPosts = $.map(model, function (item) { return new PostRating(item) });
	self.maxLength = ko.observable(mappedlikedPosts.length);
	self.showedLikedPosts(mappedlikedPosts.slice(0, self.currentLength()));
	self.expand = function () {
		self.currentLength(self.currentLength() + 4);
		self.showedLikedPosts(mappedlikedPosts.slice(0, self.currentLength()));
	};
	self.collapse = function () {
		self.currentLength(4);
		self.showedLikedPosts(mappedlikedPosts.slice(0, self.currentLength()));
	};
	ShowErrorBar();
}

function CityRating(data) {
	this.rank = ko.observable(data.rank);
	this.cityName = ko.observable(data.cityName);
	this.friendsCount = ko.observable(data.friendsCount);
}

function CityRatingModel(model) {
	var self = this;
	self.showedCities = ko.observableArray([]);
	var mappedCities = $.map(model, function (item) { return new CityRating(item) });
	self.showedCities(mappedCities.slice(0, 3));
	self.expand = function () {
		self.showedCities(mappedCities);
	};
	self.collapse = function () {
		self.showedCities(mappedCities.slice(0, 3));
	};
}

function UniversityRating(data) {
	this.rank = ko.observable(data.rank);
	this.universityName = ko.observable(data.universityName);
	this.friendsCount = ko.observable(data.friendsCount);
}

function UniversityRatingModel(model) {
	var self = this;
	self.showedUniversities = ko.observableArray([]);
	var mappedUnviersities = $.map(model, function (item) { return new UniversityRating(item) });
	self.showedUniversities(mappedUnviersities.slice(0, 3));
	self.expand = function () {
		self.showedUniversities(mappedUnviersities);
	};
	self.collapse = function () {
		self.showedUniversities(mappedUnviersities.slice(0, 3));
	};
	ShowErrorBar();
}

function FavouriteGroupsRating(data) {
	this.rank = ko.observable(data.rank);
	this.link = ko.computed(function () {
		return "http://vk.com/club" + data.group.gid;
	}, this);
	this.displayed = ko.observable(data.group.name);
	this.photo = ko.observable(data.group.photo_big);
	this.contentCount = ko.observable(data.content.length);
	this.contentList = ko.observableArray([]);
	var mappedContentList = $.map(data.content, function (item) {
		var result = { link: "" };
		switch (item.type) {
			case "photo": { result.link += "http://vk.com/club" + (0 - item.content.owner_id).toString() + "?z=photo" + item.content.owner_id + "_" + item.content.pid; break }
			case "post": { result.link += "http://vk.com/wall" + item.content.to_id + "_" + item.content.id; break }
			case "video": { result.link += "http://vk.com/video" + item.content.owner_id + "_" + item.content.vid; break }
		}
		return result;
	});
	this.contentList(mappedContentList);
}

function FavouriteGroupsRatingModel(model) {
	var self = this;
	self.showedGroups = ko.observableArray([]);
	self.currentLength = ko.observable(4);
	var mappedGroups = $.map(model, function (item) { return new FavouriteGroupsRating(item) });
	self.maxLength = ko.observable(mappedGroups.length);
	self.showedGroups(mappedGroups.slice(0, self.currentLength()));
	self.expand = function () {
		self.currentLength(self.currentLength() + 4);
		self.showedGroups(mappedGroups.slice(0, self.currentLength()));
	};
	self.collapse = function () {
		self.currentLength(4);
		self.showedGroups(mappedGroups.slice(0, self.currentLength()));
	};
	ShowErrorBar();
}

function FavouriteUsersRating(data) {
	this.rank = ko.observable(data.rank);
	this.link = ko.computed(function () {
		return "http://vk.com/id" + data.user.uid;
	}, this);
	this.displayed = ko.computed(function () {
		return data.user.first_name + " " + data.user.last_name;
	}, this);
	this.photo = ko.observable(data.user.photo_big);
	this.contentCount = ko.observable(data.content.length);
	this.contentList = ko.observableArray([]);
	var mappedContentList = $.map(data.content, function (item) {
		var result = { link: "" };
		switch (item.type) {
			case "photo": { result.link += "http://vk.com/id" + item.content.owner_id + "?z=photo" + item.content.owner_id + "_" + item.content.pid; break }
			case "post": { result.link += "http://vk.com/wall" + item.content.to_id + "_" + item.content.id; break }
			case "video": { result.link += "http://vk.com/video" + item.content.owner_id + "_" + item.content.vid; break }
		}
		return result;
	});
	this.contentList(mappedContentList);
	this.analyzeUser = function () {
		setOwnerId(data.user.uid);
	}
}

function FavouriteUsersRatingModel(model) {
	var self = this;
	self.showedUsers = ko.observableArray([]);
	self.currentLength = ko.observable(4);
	var mappedUsers = $.map(model, function (item) { return new FavouriteUsersRating(item) });
	self.maxLength = ko.observable(mappedUsers.length);
	self.showedUsers(mappedUsers.slice(0, self.currentLength()));
	self.expand = function () {
		self.currentLength(self.currentLength() + 4);
		self.showedUsers(mappedUsers.slice(0, self.currentLength()));
	};
	self.collapse = function () {
		self.currentLength(4);
		self.showedUsers(mappedUsers.slice(0, self.currentLength()));
	};
	ShowErrorBar();
}

function LinguisticAnalysisModel(model) {
	var self = this;
	self.badLanguageWordsCount = ko.observable(model.badLanguageWordsCount);
	self.uniqueWordsInPosts = ko.observable(model.uniqueWordsInPosts);
	self.uniqueWordsInReposts = ko.observable(model.uniqueWordsInReposts);
	self.topWords = ko.observableArray([]);
	//var topWordsArray = [];
	//for (var i = 1; i <= model.topWords.length - 1; i += 3) {
	//	topWordsArray.push({ firstWord: model.topWords[i - 1].name + ' - ' + model.topWords[i - 1].value, secondWord: model.topWords[i].name + ' - ' + model.topWords[i].value, thirdWord: model.topWords[i + 1].name + ' - ' + model.topWords[i + 1].value });
	//}
	//self.topWords(topWordsArray);
	self.badLanguagePosts = ko.observableArray([]);
	model.badLanguagePosts = model.badLanguagePosts.filter(function (itm, i, a) { return i == a.indexOf(itm); });
	var mappedBadLanguagePosts = $.map(model.badLanguagePosts, function (item) {
		return { link: "http://vk.com/wall" + item.to_id + "_" + item.id, text: item.text };
	});
	self.badLanguagePosts(mappedBadLanguagePosts);
	ShowErrorBar();
}

function CurrentUserModel(model) {
	var self = this;
	self.user_id = ko.observable(model.uid);
	self.user_name = ko.computed(function () {
		return model.first_name + " " + model.last_name;
	}, this);
	self.photo_src = ko.observable(model.photo_rec);
	self.link = ko.computed(function () {
		return "http://vk.com/id" + model.uid;
	}, this);
	self.analyzeUser = function () {
		setOwnerId(model.uid);
	}
	self.stringifiedUser = ko.observable(JSON.stringify(model));
}

function hideProgressbar(parent) {
	var $progressBar;
	if (parent) {
		$progressBar = $('.progressbar', $(parent))
	}
	else {
		$progressBar = $('.progressbar');
	}
	$progressBar
		.hide()
		.remove();
}

function backToMyStats() {
	localStorage['user_id'] = "";
	location.href = "/Like/Me";
}

function addToWatchList(id) {
	$.ajax({
		url: "https://api.vk.com/method/users.get?" + access_token + "&uids=" + id + "&fields=photo_rec",
		dataType: "jsonp",
		success: function (data) {
			$.ajax({
				type: 'POST',
				url: '/Database/AddToWatchList',
				data: { userId: viewer_id, watchedUser: JSON.stringify(data.response[0]) },
				success: function () {
					location.href = "/Like/Me";
				}
			});
		}
	})
}

function setOwnerId(id) {
	$.ajax({
		url: "https://api.vk.com/method/users.get?" + access_token + "&name_case=gen&uids=" + id,
		dataType: "jsonp",
		success: function (data) {
			if (data.error || data.response[0].first_name === "DELETED") {
				$('#search-error').show();
			}
			else {
				localStorage['user_id'] = "&owner_id=" + data.response[0].uid;
				localStorage['user_link'] = id;
				addToWatchList(data.response[0].uid);
			}
		}
	});
}

function ShowErrorBar() {
	var current_href = $('.nav-pills li[class=active]>a').attr('href');
	var error_bar = $('#error-bar');
	if ((current_href === '#like-you' || current_href === '#like-me') && showErrorBar) {
		error_bar.show();
	}
	else {
		error_bar.hide();
	}
}

function showOtherPerson() {
	var tb = $('#user-link');
	var keyEvent = jQuery.Event("keypress");
	keyEvent.keyCode = 13;
	tb.trigger(keyEvent);
}

function dataLoaded() {
	$('#tab-navigation').show();
	$('#hobbies').show();
	$('.loader').hide();
	$('.activityTitleContainer').each(function (i, item) {
		$(item).css('line-height', $(item).parent('.activityContainer').css('height'));
	});
	$('#activitiesContainer').css('margin-top', $('#activitiesContainer').parent().height() / 2 - $('#activitiesContainer').height() / 2)
}

function renderSmallAndBigChart(item) {
	$('.small-chart-container').removeClass('active');
	var targetId;
	if (item.hasClass('small-chart-container')) {
		targetId = item.attr("id");
		item.addClass('active');
	}
	else {
		targetId = item.parents('.small-chart-container').attr("id");
		item.parents('.small-chart-container').addClass('active');
	}
	$('#target-chart-container').empty();
	$('#chart-comment>div').hide();
	try {
		switch (targetId) {
			case 'contentType-chart':
				{
					$('#content-type-comment').show();
					contentTypeChart.options.chart.renderTo = 'target-chart-container';
					contentTypeChart.options.chart.width = '528';
					contentTypeChart.options.chart.height = '271';
					contentTypeChart.options.plotOptions.pie.dataLabels.enabled = true;
					contentTypeChart.options.tooltip.style.padding = '3';
					contentTypeChart.options.legend.enabled = true;
					var newchart = new Highcharts.Chart(contentTypeChart.options);
					break;
				}
			case 'posts-by-month-chart':
				{
					$('#likes-comment').show();
					postsAndLikesChart.options.chart.renderTo = 'target-chart-container';
					postsAndLikesChart.options.chart.width = '528';
					postsAndLikesChart.options.chart.height = '271';
					postsAndLikesChart.options.legend.enabled = true;
					postsAndLikesChart.options.tooltip.style.padding = '3';
					postsAndLikesChart.options.yAxis.plotBands.map(function (item) {
						return item.label.style.display = 'true';
					});
					var newchart = new Highcharts.Chart(postsAndLikesChart.options);
					break;
				}
			case 'group-reposts-chart':
				{
					$('#reposts-comment, #reposts-comment div').show();
					groupRepostsChart.options.chart.renderTo = 'target-chart-container';
					groupRepostsChart.options.chart.width = '528';
					groupRepostsChart.options.chart.height = '271';
					groupRepostsChart.options.tooltip.style.padding = '3';
					groupRepostsChart.options.plotOptions.bar.dataLabels.enabled = true;
					var newchart = new Highcharts.Chart(groupRepostsChart.options);
					break;
				}
			case 'hobbies-chart':
				{
					$('#target-chart-container').empty();
					$('#hobbies-comment').empty();
					$('#target-chart-container').append($('<div />', {
						'id': 'activitiesContainer'
					}));
					renderActivities(firstPlace, "Сильный интерес");
					renderActivities(secondPlace, "Средний интерес");
					renderActivities(thirdPlace, "Слабый интерес");
					if (firstPlace.length == 0 && secondPlace.length == 0 && thirdPlace.length == 0) {
						$('#activitiesContainer').append("<p>Невозможно определить увлечения</p>");
					}
					$('#activitiesContainer').css('margin-top', $('#activitiesContainer').parent().height() / 2 - $('#activitiesContainer').height() / 2)
					var result = firstPlace.join(", ");
					if (result) {
						$('#hobbies-comment').append('<p>Пользователь имеет интерес в темах: <strong>' + result + '</strong></p>');
					}
					result = secondPlace.join(", ");
					result += (thirdPlace.length > 0 ? ", " : "") + thirdPlace.join(", ");
					if (result) {
						$('#hobbies-comment').append('<p>Возможно, пользователь заинтересован в темах: <strong>' + result + '</strong></p>');
					}
					$('#hobbies-comment').show();
				}
		}
	}
	catch (e) {
		$('#target-chart-container').append('<p><strong>Нет данных</strong></p>');
	}
	$('#chart-comment').show();
}


$(function () {
	var lang = getCookie("lang");
	if (lang) {
		$('li.dropdown>a span').text($('.dropdown-menu a[data-lang=' + lang + ']').text());
	}
	if (access_token) {
		access_token = "access_token=" + access_token;

		getWatchList()

		if (lang == 'en')
			$('.pull-right.nav').append('<li><a href="/" onclick="deleteCookie(\'access_token\')">Log off</a></li>');
		else
			$('.pull-right.nav').append('<li><a href="/" onclick="deleteCookie(\'access_token\')">Выйти</a></li>');

		$('.auth, .image-main-wrapper, #header').hide();

		var sentUserId = location.hash.substring(1);
		if (sentUserId && user_id.split('=')[1] != viewer_id && user_id.split('=')[1] != sentUserId) {
			setOwnerId(sentUserId);
		}

		if (user_id && user_id.split('=')[1] != viewer_id) {
			if (user_link) {
				$('#user-link').val(user_link);
			}
			location.hash = user_link;
			$($('.container .nav-pills li')[2]).css('display', 'none');
			$.ajax({
				url: "https://api.vk.com/method/users.get?" + access_token + "&uids=" + localStorage['user_id'].split('=')[1] + "&fields=photo_rec",
				dataType: "jsonp",
				success: function (data) {
					var model = data.response[0];
					$('#tell-friends > div').append(VK.Share.button({
						url: location.href,
						title: model.first_name + ' ' + model.last_name + ' на Manology.info'
					},
					{
						type: 'custom',
						text: "<img src=\"http://vk.com/images/vk32.png?1\" />"
					}));
					ko.applyBindings(new CurrentUserModel(model), $('#current-user')[0]);
				}
			});
			$('#top-liked-me-users h2 small').text('которым понравился этот человек:');
			$('#most-liked-photo h2').text('Рейтинг фотографий человека:');
			$('#most-liked-post h2').text('Рейтинг постов человека:');
			$('#show-my-rating').show();
			$('#current-user').show();
			$('#recalculate-button').show();
		}
		else {
			location.hash = viewer_id;
			$.ajax({
				url: "https://api.vk.com/method/users.get?" + access_token + "&uids=" + viewer_id + "&fields=photo_rec",
				dataType: "jsonp",
				success: function (data) {
					var model = data.response[0];
					$('#tell-friends > div').append(VK.Share.button({
						url: location.href,
						title: model.first_name + ' ' + model.last_name + ' на Manology.info'
					},
					{
						type: 'custom',
						text: "<img src=\"http://vk.com/images/vk32.png?1\" />"
					}));
					ko.applyBindings(new CurrentUserModel(model), $('#current-user')[0]);
				}
			});
			$($('.container .nav-pills li')[1]).css('display', true);
			$('#top-liked-me-users h2 small').text('которым я понравился:');
			$('#most-liked-photo h2').text('Рейтинг моих фотографий:');
			$('#most-liked-post h2').text('Рейтинг моих постов:');
			$('#show-my-rating').hide();
			$('#current-user').show();
			$('#recalculate-button').hide();
		}

		$('.nav-pills li').on('shown', function (e) {
			ShowErrorBar();
		})

		$('#modal-person-href').keypress(function (key) {
			if (key.keyCode === 13) {
				$('#modal-person-submit').click();
			}
		});

		$('.text-wall').live('click', function (e) {
			if (e.target.localName == 'a')
				return;
			window.open($(this).find('a').attr('href'), '_blank');
		});


		$('#user-link').keypress(function (key) {
			var link = $(this).val();
			if (key.keyCode === 13) {
				$('#search-warning').hide();
				var id = link.lastIndexOf('/') != -1 ? link.substr(link.lastIndexOf('/') + 1) : link;
				setOwnerId(id);
			}
		})

		$('.small-chart-container').click(function (item) {
			renderSmallAndBigChart($(item.target));
		});

		//$('#hobbies-chart').click();
		//$('#chart-navigation>li>a')[0].click();

	}
	else {
		$('.auth, .image-main-wrapper, #header').show();
		$('.body-info, .subhead.custom, .navbar-search').hide();
		//$('.loading-wrapper').hide();
		$('#tell-friends > div').append(VK.Share.button({
			url: location.href,
			title: 'Manology.info'
		},
					{
						type: 'custom',
						text: "<img src=\"http://vk.com/images/vk32.png?1\" />"
					}));
	}
});

function renderActivities(arr, title) {
	if (arr.length > 0) {
		var cnt = $('<div />', {
			'class': 'activityContainer'
		});
		var titleCnt = $('<div />', {
			'class': 'activityTitleContainer',
			'text': title
		});
		var ulCnt = $('<div />', {
			'class': 'activityUlContainer'
		});
		var clear = $('<div />', {
			'class': 'clear'
		});
		var ul = $('<ul />');
		for (var i = 0; i < arr.length; i++) {
			var ulLink = $('<li><a>' + arr[i] + '</a></li>');
			ulLink.click(function () {
				var it = $('#chart-navigation li a:contains("' + $(this).text() + '")');
				it.parent().click();
				$('body').animate({ scrollTop: it.offset().top }, 'slow');
			});
			ul.append(ulLink);
		}
		ulCnt.append(ul);
		cnt.append(titleCnt).append(ulCnt).append(clear);
		$('#activitiesContainer').append(cnt);
		var targetHeight = ulCnt.css('height');
		titleCnt.css('line-height', targetHeight);
	}
}
