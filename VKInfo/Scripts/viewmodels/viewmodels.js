function UserModel(data) {
	var self = this;
	var mappedLikes = data.likes.map(function (item) { return new ContentRatingModel(item) });
	var mappedReposts = data.reposts.map(function (item) { return new ContentRatingModel(item) });

	self.photo = data.photo;
	self.name = data.name;
	self.link = data.link;
	self.recounted = data.recounted;
	self.likes = mappedLikes;
	self.reposts = mappedReposts;

	self.recount = function () {
		//function call
	}
	self.delete = function () {
		//function call
	}
	self.analyze = function () {
		//function call
	}
}

function ContentModel(data) {
	var self = this;

	self.link = data.link;
	self.image = data.image;
	self.title = data.title;
	self.likes = data.likes;
	self.reposts = data.reposts;
}

function WallAnalyzisModel(data) {
	var self = this;

	self.interests = data.interests;
	self.reposts = data.reposts;
	self.popularity = data.popularity;
	self.posts = data.posts;
	self.psycho = data.psycho;
	self.showed = data.interests;

	self.change = function (vm, e) {
		self.showed(vm[e.target]);
	}
}

function WallAnalyzisDescriptionModel(data) {
	var self = this;

	self.themes = ko.observable(data.themes);
	self.contents = ko.observable(data.contents);
	self.reposts = ko.observable(data.reposts);

	self.change = function (vm, e) {
		self.showed(vm[e.target]);
	}
}

function UsersRatingModel(data, rowLength) {
	var self = this;
	var mappedData = data.map(function (item) { return new UserModel(item) });

	self.currentLength = ko.observable(rowLength);
	self.showed = ko.observableArray(mappedData.slice(0, self.currentLength()));

	self.currentLength.subscribe(function () {
		self.showed(mappedData.slice(self.currentLength()));
	});

	self.expand = function () {
		self.currentLength(self.currentLength() + rowLength);
	}
	self.collapse = function () {
		self.currentLength(self.currentLength() - rowLength);
	}
}

function ContentRatingModel(data, rowLength) {
	var self = this;
	var mappedData = data.map(function (item) { return new ContentModel(item) });

	self.currentLength = ko.observable(rowLength);
	self.showed = ko.observableArray(mappedData.slice(0, self.currentLength()));

	self.currentLength.subscribe(function () {
		self.showed(mappedData.slice(self.currentLength()));
	});

	self.expand = function () {
		self.currentLength(self.currentLength() + rowLength);
	}
	self.collapse = function () {
		self.currentLength(self.currentLength() - rowLength);
	}
}

function RecentlyWatchedModel(data) {
	var self = this;
	var mappedData = data.map(function (item) { return new UserModel(item) });

	self.showed = ko.observableArray(mappedData);
}

function UsersComparison(data) {
	var self = this;

	self.popularity = data.popularity;
	self.mutualFriends = data.mutualFriends;
	self.mutualGroups = data.mutualGroups;
	self.mutualLikedUsers = data.mutualLikedUsers;
	self.mutualLikes = data.mutualLikes;
}

