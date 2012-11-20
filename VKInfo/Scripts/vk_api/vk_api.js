var API_URL = 'https://api.vk.com/method/';
var testWallObject = {};

function fooOne() {
	for (var i = 0; i < 10; i += 10) {
		(function (i) {
			console.log(i);
		})(i);
	}
}

function testWallLoad() {
	_AJAXRequests.getVKWall.func(testWallObject, testLikesLoad);
}

function splitArray(a, n) {
	var len = a.length, out = [], i = 0;
	while (i < len) {
		var size = Math.ceil((len - i) / n--);
		out.push(a.slice(i, i + size));
		i += size;
	}
	return out;
}

function testLikesLoad(data) {
	//_AJAXRequests.getVKWallPostLikes.func(data.wall, _AJAXRequests.getVKWallPostLikes.func, 0, [], 0);
	data.liked_wall = data.wall.filter(function (item) {
		return item.likes.count;
	});
	var splitLength = data.wall.length / 2500;
	data.liked_wall = splitArray(data.liked_wall, splitLength);
	_AJAXRequests.getVKWallPostLikes.funcforsplitted(data.liked_wall, likedLoaded, 0);
	//data.wall.forEach(function (item, index) {
	//	console.log($.active);
	//	_AJAXRequests.getVKWallPostLikes.funcfail(item, false, item.id, [], 0);
	//});
}

function likedLoaded(data) {
	console.log('success!');
	console.log(data);
}

function allAJAXCompleted() {
	alert('all AJAX completed!');
}

function singleAJAXCompleted() {
	for (var i in _AJAXRequests) {
		if (!_AJAXRequests[i].completed) {
			return false;
		}
	}
	allAJAXCompleted();
	var obj = {};
	_AJAXRequests.getVKWall.func(obj);
}

var _AJAXRequests = {

	getVKWall: {
		completed: false,
		func: function (target, callback) {
			var wall = [];
			$.ajax({
				url: API_URL + 'wall.get?' + access_token + user_id + '&count=100&filter=owner',
				dataType: 'jsonp',
				success: function (data) {
					try {
						wall = wall.concat(data.response.slice(1));
						if (data.response[0] > 100) {
							_AJAXRequests.getVKWall.generateOffsets(target, callback, wall, data.response[0]);
						}
						else {
							target.wall = wall;
							_AJAXRequests.getVKWall.completed = true;
							if (callback) {
								callback(target);
							}
							singleAJAXCompleted('getVKWall');
						}
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		},
		generateOffsets: function (target, callback, wall, count) {
			var generateAmount = Math.ceil(count / 100) * 100;
			var counter = 0;
			for (var offset = 100; offset <= generateAmount; offset += 100) {
				(function (offset) {
					$.ajax({
						url: API_URL + 'wall.get?' + access_token + user_id + '&offset=' + offset + '&count=100&filter=owner',
						dataType: 'jsonp',
						success: function (data) {
							try {
								wall = wall.concat(data.response.slice(1));
								counter += 100;
								if (counter === generateAmount) {
									target.wall = wall;
									_AJAXRequests.getVKWall.completed = true;
									if (callback) {
										callback(target);
									}
									singleAJAXCompleted('getVKWall');
								}
							}
							catch (e) {
							}
						}
					});
				})(offset);
			}
		}
	},

	getVKFriends: {
		completed: false,
		func: function (target) {
			$.ajax({
				url: API_URL + 'friends.get?' + access_token + user_id,
				dataType: 'jsonp',
				success: function (data) {
					try {
						target.friends = data.response.slice();
						_AJAXRequests.getVKFriends.completed = true;
						singleAJAXCompleted('getVKFriends');
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		}
	},

	getVKPhotos: {
		completed: false,
		func: function (target, callback) {
			var photos = [];
			$.ajax({
				url: API_URL + 'photos.getAll?' + access_token + user_id + '&extended=1&count=100',
				dataType: 'jsonp',
				success: function (data) {
					try {
						photos = photos.concat(data.response.slice(1));
						if (data.response[0] > 100) {
							_AJAXRequests.getVKPhotos.generateOffsets(target, callback, photos, data.response[0]);
						}
						else {
							target.photos = photos;
							_AJAXRequests.getVKPhotos.completed = true;
							singleAJAXCompleted('getVKPhotos');
						}
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		},
		generateOffsets: function (target, callback, photos, count) {
			var generateAmount = Math.ceil(count / 100) * 100;
			var counter = 0;
			for (var offset = 100; offset <= generateAmount; offset += 100) {
				(function (offset) {
					$.ajax({
						url: API_URL + 'photos.getAll?' + access_token + user_id + '&offset=' + offset + '&count=100&filter=owner',
						dataType: 'jsonp',
						success: function (data) {
							try {
								photos = photos.concat(data.response.slice(1));
								counter += 100;
								if (counter === generateAmount) {
									target.photos = photos;
									_AJAXRequests.getVKWall.completed = true;
									if (callback) {
										callback(target);
									}
									singleAJAXCompleted('getVKPhotos');
								}
							}
							catch (e) {
							}
						}
					});
				})(offset);
			}
		}
	},

	//getVKGroups: {
	//	completed: false, func: function (target, groups, offset) {
	//		$.ajax({
	//			url: 'API_URLgroups.get?' + access_token + user_id + '&extended=1&count=1000&offset=' + offset,
	//			dataType: 'jsonp',
	//			success: function (data) {
	//				try {
	//					if (data.response[0] > offset) {
	//						groups = groups.concat(data.response.slice(1));
	//						_AJAXRequests.getVKGroups.func(target, groups, offset + 1000);
	//					}
	//					else {
	//						target.value = groups;
	//						_AJAXRequests.getVKGroups.completed = true;
	//						singleAJAXCompleted('getVKGroups');
	//					}
	//				}
	//				catch (e) {
	//				}
	//			}
	//		});
	//	}
	//},

	getVKGroupsById: {
		completed: false,
		func: function (target, gids) {
			$.ajax({
				url: API_URL + 'groups.getById?' + access_token + user_id + '&gids=' + gids,
				dataType: 'jsonp',
				success: function (data) {
					try {
						target.groups = data.response.slice();
						_AJAXRequests.getVKGroupsById.completed = true;
						singleAJAXCompleted('getVKGroupsById');
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		}
	},

	getVKWallPostLikes: {
		completed: false,
		funcforsplitted: function (target, callback, arrayIndex) {
			var liked = [];
			var count = 0;
			if (target[arrayIndex]) {
				target[arrayIndex].forEach(function (item, index) {
					if (item.likes.count) {
						$.ajax({
							url: API_URL + 'likes.getList?' + access_token + user_id + '&type=post&item_id=' + item.id + '&count=1000',
							beforeSend: function () { $(this).data('index', index) },
							dataType: 'jsonp',
							success: function (data) {
								try {
									liked = data.response.users.slice();
									if (data.response.count > 1000) {
										_AJAXRequests.getVKWallPostLikes.funcsingle(target[arrayIndex][$(this).data('index')], liked, 1000);
									}
									else {
										target[arrayIndex][$(this).data('index')].likes_list = liked.slice();
									}
									count++;
									if (count === target[arrayIndex].length - 1) {
										_AJAXRequests.getVKWallPostLikes.funcforsplitted(target, callback, arrayIndex + 1);
									}
								}
								catch (e) {
									console.log(e);
								}
							}
						});
					}
				});
			}
			else {
				callback(target);
			}
		},
		funcsingle: function (target, liked, offset) {
			$.ajax({
				url: API_URL + 'likes.getList?' + access_token + user_id + '&type=post&item_id=' + target.id + '&count=1000&offset=' + offset,
				dataType: 'jsonp',
				success: function (data) {
					try {
						liked = liked.concat(data.response.users);
						if (offset + 1000 < data.response.count) {
							_AJAXRequests.getVKWallPostLikes.funcsingle(target, liked, offset + 1000);
						}
						else {
							target.likes_list = liked.slice();
						}
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		}
	},

	getVKWallPostReposts: {
		completed: false,
		func: function (target, callback, postId, reposted, offset) {
			$.ajax({
				url: API_URL + 'likes.getList?' + access_token + user_id + '&type=post&filter=copies&item_id=' + postId + '&count=1000&offset=' + offset,
				dataType: 'jsonp',
				success: function (data) {
					try {
						reposted = reposted.concat(data.response.users);
						if (data.response.count > offset + 1000) {
							_AJAXRequests.getVKWallPostReposts.func(target, callback, postId, reposted, offset + 1000);
						}
						else {
							target.reposts_list = reposted.slice();
							_AJAXRequests.getVKWallPostReposts.completed = true;
							if (callback) {
								callback(target);
							}
							singleAJAXCompleted('getVKWallPostReposts');
						}
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		}
	},

	getVKUsers: {
		completed: false,
		func: function (target, callback, uids) {
			$.ajax({
				url: API_URL + 'users.get?' + access_token + '&uids=' + uids,
				dataType: 'jsonp',
				success: function (data) {
					try {
						target.users = data.response.slice();
						_AJAXRequests.getVKUsers.completed = true;
						if (callback) {
							callback(target);
						}
						singleAJAXCompleted('getVKUsers');
					}
					catch (e) {
						console.log(e);
					}
				}
			});
		}
	}
}
