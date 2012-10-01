/// <reference path="jquery-1.7.2-vsdoc.js" />
/*globals _comma_separated_list_of_variables_*/

var app = {
    //	appId: 3016703,
    //	appSecret: "Zz8fFBdaRDyMBQ0NDElV",
    //	redirectUri: "http://wonder42.cloudapp.net/User/Auth"

    //	//	appId: 2989190,
    //	//	appSecret: "lT1Z9ABYTtsdZaQWVoen",
    //	//	redirectUri: "http://42.rise-tech.com/User/Auth"

    appId: 2995743,
    appSecret: "5pxH8x5L8rT977WflGn0",
    redirectUri: "http://127.0.0.1:4621/User/Auth"
}

getSVG = function(charts) {
    var svgArr = [],
        top = 0,
        width = 0;

    $.each(charts, function(i, chart) {
        var svg = chart.getSVG();
        svg = svg.replace('<svg', '<g transform="translate(0,' + top + ')" ');
        svg = svg.replace('</svg>', '</g>');

        top += chart.chartHeight;
        width = Math.max(width, chart.chartWidth);

        svgArr.push(svg);
    });

    return '<svg height="'+ top +'" width="' + width + '" version="1.1" xmlns="http://www.w3.org/2000/svg">' + svgArr.join('') + '</svg>';
};

var contentTypeChart;
var groupRepostsChart;
var postsAndLikesChart;

var favouriteGroups = {};  //группы, которые я лайнкул
var favouriteUsers = {};   //пользователи, которых я лайкнул
var likedMeUsers = {};    //пользователи, которые лайкнули меня
var likedContent = []; //все, что лайкнули

var viewer_id = localStorage['viewer_id'] ? localStorage['viewer_id'] : "";
var user_id = localStorage['user_id'] ? localStorage['user_id'] : "";
var user_link = localStorage['user_link'] ? localStorage['user_link'] : "";

var scope = "friends,wall,video,photos,groups,pages";
var auth = function () {
    location.href = "http://oauth.vk.com/authorize?client_id=" + app.appId + "&display=page&scope=" + scope + "&redirect_uri=" + app.redirectUri + "&response_type=token";
}
var access_token = getCookie("access_token") || "";

var wallText = {}; 	 //слова постов со стены
var repostText = {}; //слова с репостов
var wallPosts = [];
var wallWords = [];
var filthyFilter = ["fuck", "бля", "бляди", "блядь", "блять", "блеать", "блеять", "выебал", "выебать", "выебу", "гавно", "говно", "говнюк", "гавнюк", "гондон", "гандон", "ебаная", "ебаной", "ебану", "ебать", "ебну", "ебнуть", "ебошила", "ебошить", "ебырь", "жопа", "заебал", "заебу", "мудак", "мудило", "наебать", "наебка", "нахуй", "отсос", "охуел", "охуеть", "педораз", "педорас", "пидараз", "пидарас", "пидор", "пидораз", "пдорас", "пизда", "пиздец", "пиздить", "пизду", "пизды", "пиписька", "писька", "письку", "проститутка", "проститутки", "спиздить", "сука", "хер", "хуй", "хуйня", "хуя", "хуяч", "цела", "шлюха"];

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
//    $.ajax({
//        type: 'POST',
//        url: '/Database/SaveData',
//        data: { accessToken: access_token, userId: viewer_id, data: data, fieldName: fieldName }
//    });
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
};

var filteredPosts = [];
function renderLinguisticAnalysis(offset) {
    var linguisticModel = {};
    var filter = "filter=owner";
    $.ajax({
        url: "https://api.vk.com/method/wall.get?" + access_token + user_id + "&" + filter + "&offset=" + offset + "&count=100",
        dataType: "jsonp",
        success: function (data) {
            if (offset < data.response[0]) {
                wordSplitter(data.response);
                for (var i = 1; i < data.response[0]; i++) {
                    if (data.response[i] != undefined)
                        filteredPosts.push(data.response[i]);
                }
                renderLinguisticAnalysis(offset + 100);
            }

            else {
                linguisticModel['uniqueWordsInPosts'] = Object.keys(wallText).length;
                var a = [];
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
                ko.applyBindings(new LinguisticAnalysisModel(linguisticModel), $('#dictionary-power')[0]);
                hideProgressbar($('#word-stat'));
                hideProgressbar($('#top-words'));
            }
        }
    });
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
            if (data.error) {
                console.log(user_id);
            }
            if (offset < data.response[0]) {
                for (var i = 1; i < data.response[0]; i++) {
                    if (data.response[i] != undefined) {
                        allPosts.push(data.response[i]);
                    }
                }
                loadAllPosts(offset + 100);
            }
            else {
                renderHobbies(allPosts);

                renderContentTypeInfo(allPosts);

                renderGroupReposts();
            }
        }
    });
}

function renderGroupReposts() {
    var groupIds = [];
    var groupReposts={};
    for (var i in allPosts) {
        if (allPosts[i].copy_owner_id && allPosts[i].copy_owner_id < 0) {
           groupIds.push(allPosts[i]);
        }
    }
    var counter = 0;
    for (var i in groupIds){
     $.ajax({
                 url: "https://api.vk.com/method/groups.getById?" + access_token + "&gids=" + (0 - groupIds[i].copy_owner_id),
                 beforeSend: function() {
                    $(this).data('index', i);
                 },
                 dataType: "jsonp",
                 success: function (data) {
                    if (groupReposts[data.response[0].name]) {
                        groupReposts[data.response[0].name].push("<li><a target='_blank' href=http://vk.com/wall" + groupIds[$(this).data('index')].copy_owner_id + "_" + groupIds[$(this).data('index')].copy_post_id + ">"+ "http://vk.com/wall" + groupIds[$(this).data('index')].copy_owner_id + "_" + groupIds[$(this).data('index')].copy_post_id +"</a></li>");
                    }
                    else {
                        groupReposts[data.response[0].name] = [];
                        groupReposts[data.response[0].name].push("<li><a target='_blank' href=http://vk.com/wall" + groupIds[$(this).data('index')].copy_owner_id + "_" + groupIds[$(this).data('index')].copy_post_id + ">" + "http://vk.com/wall" + groupIds[$(this).data('index')].copy_owner_id + "_" + groupIds[$(this).data('index')].copy_post_id +"</a></li>");
                    }
                    counter++;
                    if (counter === groupIds.length){
                        var seriesOptions = [];
                        for (var i in groupReposts){
                            seriesOptions.push({name: i, data: [groupReposts[i].length]})
                        }
                        seriesOptions.sort(function (a, b) {
                                        return b.data[0] - a.data[0];
                                    });
                        seriesOptions = seriesOptions.slice(0,5).reverse();
                        for (var i in seriesOptions) {
                            $template = $(groupReposts[seriesOptions[i].name]);
                            $theme = $('<li class="active"><a href="#">' + seriesOptions[i].name + '</a></li>');
                            $theme.click(function () {
                                $('.active', $(this).parent()).removeClass('active')
                                $(this).addClass('active')
                                itemText = $(this).find('a').text();
                                $('.links').empty()
                                var top20 = 0;
                                for (var link in groupReposts[itemText]) {
                                    $('.links').append($(groupReposts[itemText][link]))
                                    $('.links').append($('<br/>'));
                                    top20++;
                                    if (top20 === 20) {
                                        break;
                                    }
                                }
                                return false;
                            });
                            $('#subscribes-tab').after($theme)
                        }
                        $('.active').click();
                        groupRepostsChart = new Highcharts.Chart({
                                chart: {
                                    renderTo: 'chart-container-invisible',
                                    type: 'column',                    
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
                                legend: {enabled: false},
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
                                    formatter: function() {
                                        return 'Репосты "'+
                                            this.series.name +'": '+ this.y +' ';
                                    }
                                },
                                plotOptions: {
                                    column: {
				                        pointPadding: 0.2,
				                        borderWidth: 0,
                                        cursor: 'pointer',
                                        point: {
                                            events: {
                                                click: function() {
                                                    alert (this.series.name);
                                                }
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
                        linksToPosts[toNormalContentType("photo")].push("<li><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + "><img src='" + posts[p].attachments[a].photo.src + "'></img></a></li>");
                        sum++;
                        break;
                    case "video":
                        if (!linksToPosts[toNormalContentType("video")]) {
                            linksToPosts[toNormalContentType("video")] = [];
                        }
                        linksToPosts[toNormalContentType("video")].push("<li><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + "><img src='" + posts[p].attachments[a].video.image + "'></img></a></li>");
                        sum++;
                        break;
                    case "audio":
                        if (!linksToPosts[toNormalContentType("audio")]) {
                            linksToPosts[toNormalContentType("audio")] = [];
                        }
                        linksToPosts[toNormalContentType("audio")].push("<li><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + ">" + posts[p].attachments[a].audio.performer + "-" + posts[p].attachments[a].audio.title + "</a></li>");
                        sum++;
                        break;
                    case "poll":
                        if (!linksToPosts[toNormalContentType("poll")]) {
                            linksToPosts[toNormalContentType("poll")] = [];
                        }
                        linksToPosts[toNormalContentType("poll")].push("<li><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + ">" + posts[p].attachments[a].poll.question + "</a></li>");
                        sum++;
                        break;
                    case "graffiti":
                        if (!linksToPosts[toNormalContentType("graffiti")]) {
                            linksToPosts[toNormalContentType("graffiti")] = [];
                        }
                        linksToPosts[toNormalContentType("graffiti")].push("<li><a target='_blank' href=" + "http://vk.com/wall" + posts[p].to_id + "_" + posts[p].id + "><img src='" + posts[p].attachments[a].graffiti.src + "'></img></a></li>");
                        sum++;
                        break;

                }
            }
        }
    }
    for (var l in linksToPosts) {
        $template = $(linksToPosts[l]);
        $theme = $('<li class="active"><a href="#">' + l + '</a></li>');
        $theme.click(function () {

            $('.active', $(this).parent()).removeClass('active')
            $(this).addClass('active')

            itemText = $(this).find('a').text();
            $('.links').empty()
            var top20 = 0;
            for (var link in linksToPosts[itemText]) {
                $('.links').append($(linksToPosts[itemText][link]))
                $('.links').append($('<br/>'));
                top20++;
                if (top20 === 20) {
                    break;
                }
            }
            return false;
        });
        $('#wall-tab').after($theme)
    }

    var chartData = [];
    if (sum != 0) {
        for (var i in linksToPosts) {
            if (linksToPosts[i].length > 0)
                chartData.push([name = i, y = parseFloat((linksToPosts[i].length / sum * 100).toFixed(2))]);
        }
        if (chartData.length > 0) {
            contentTypeChart = new Highcharts.Chart({
                chart: {
                    renderTo: 'chart-container-invisible',
                    type: 'pie',
                    width: 150,
                    height: 150
                },
                title: {text: 'Записи на стене'},
                plotOptions: {
                    pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {enabled: false},
                            point: {
                                events: {
                                    click: function(event) {
                                             $('#chart-navigation li a:contains("' + this.name + '")').parent().click();
                                        }
                                }
                            }
                        }
                    },
                series: [{
                    name: 'Процент',
                    data: chartData
                }],
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
            for (var p in sum) {
                if (p != "tp" && sum[p] > 0) {
                    chartData.push({ name: toNormalTitle(p), data: [y = parseFloat((sum[p] * 100 / sumStat).toFixed(2))] });
                }
            }
            var linksOfTheme = []
            var tabOfTheme = []
            first = true

            for (var i in data) {
                for (var j in data[i].Info) {
                    var p = getPostbyID(posts, data[i].ID);
                    if (j != "tp" && data[i].Info[j] >= 0.6 * max[j] && data[i].Info[j] * 100.0 / Math.max(p.text.length, 100.0) > 1.5) {
                        var link = "http://vk.com/wall" + p.to_id + '_' + p.id;
                        if (linksOfTheme[toNormalTitle(j)]) {
                            linksOfTheme[toNormalTitle(j)].push('<li><a href="' + link + '" target="_blank" >' + toShortPost(p.text) + '</a></li><br/>')
                        }
                        else {
                            linksOfTheme[toNormalTitle(j)] = [];
                            linksOfTheme[toNormalTitle(j)].push('<li><a href="' + link + '" target="_blank" >' + toShortPost(p.text) + '</a></li>')
                            if (first) {
                                tabOfTheme[toNormalTitle(j)] = '<li><a href="#" class="active">' + toNormalTitle(j) + '</a></li>';
                                first = false;
                            }
                            else
                                tabOfTheme[toNormalTitle(j)] = '<li><a href="#">' + toNormalTitle(j) + '</a></li>'
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
                        $('.links').append($('<br/>'))
                    }
                    return false;
                });
                $('#hobbies-tab').after($template);
            }

            hideProgressbar($('#chart-container'));
            var tempMass = [];
            for (var i in sum)
                if (i != "tp" && sum[i] > 0.3)
                    tempMass.push(i);

            if (sumStat > 0 && tempMass.length > 0) {
                chartData.sort(function (a, b) {
                    return b.data[0] - a.data[0];
                });

                //				hobbies_chart = new Highcharts.Chart({
                //					chart: {
                //						renderTo: 'hobbies-chart',
                //						type: 'column'
                //					},
                //					plotOptions: {
                //						series: {
                //							events: {
                //								click: function (e) {
                //									console.log(e); 
                //								}
                //							}
                //						}
                //					},
                //					title: {
                //						text: " "
                //					},
                //					tooltip: {
                //						formatter: function () {
                //							return '<span style="color:{series.color}">' + this.series.name + '</span>: <b>' + this.point.y + '</b><br/>';
                //						}
                //					},
                //					series: chartData,
                //					xAxis: axis,
                //					yAxis: {
                //						min: 0,
                //						title: {
                //							text: '%'
                //						}
                //					},
                //					credits: { enabled: false }

                //				});
            }
            else
                if (getCookie("lang") == "en")
                    $('#hobbies-tab').after($("<p>Do you have too few posts, to determine your hobbies.</p>"));
                else
                    $('#hobbies-tab').after($("<p>У Вас слишком мало постов, чтобы определить Ваши увлечения.</p>"));
                hideProgressbar($('#top-posts'));
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
    hideProgressbar($('#top-universities'));
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
                    }},
        series: [{
            name: 'Количество',
            data: chartData
        }],
        credits: { enabled: false }
    });
    hideProgressbar($('#sex-percentage'));
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
            hideProgressbar($('#top-cities'));
        }
    });
}

function renderUsersInfo(usersDict, index, model, usersArray) {
    var counter = 0;
    if (index === 0) {
        var usersDictKeys = Object.keys(usersDict);
        for (var i = 0; i < usersDictKeys.length; i++) {
            usersArray.push([usersDictKeys[i], usersDict[usersDictKeys[i]].liked.length]);
        }
        usersArray.sort(function (a, b) {
            return b[1] - a[1];
        });
        usersArray = usersArray.slice(0, 50);
    }
    if (index >= usersArray.length) {
        model.sort(function (a, b) {
            return b.liked.length - a.liked.length;
        });
        for (var k = 0; k < model.length; k++) {
            model[k].rank = (k + 1).toString();
        }
        saveDataToMongoDB(JSON.stringify(model), 'LikedMeUsers');
        ko.applyBindings(new LikedMeRatingModel(model), $('#top-liked-me-users')[0]);
        $('#likedme-rating, #top-liked-me-users .form-actions').show();
        hideProgressbar($('#top-liked-me-users'));
    }
    else {
        $.ajax({
            url: "https://api.vk.com/method/users.get?uids=" + usersArray[index][0] + "&fields=uid,photo_big",
            dataType: "jsonp",
            success: function (data) {
                model.push({ rank: 0, user: data.response[0], liked: usersDict[data.response[0].uid].liked, reposts: usersDict[data.response[0].uid].reposts });
                renderUsersInfo(usersDict, index + 1, model, usersArray);
            }
        });
    }
}

function getFavouritePosts(offset, outputUsers, outputGroups, pidArray) {
    $.ajax({
        url: "https://api.vk.com/method/fave.getPosts?" + access_token + "&count=100" + "&offset=" + offset,
        dataType: "jsonp",
        success: function (data) {
            if (offset < data.response[0]) {
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
            if (offset < data.response[0]) {
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
            if (offset < data.response[0]) {
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
            saveDataToMongoDB(JSON.stringify(modelGroups), 'FavouriteGroups');
            ko.applyBindings(new FavouriteGroupsRatingModel(modelGroups), $('#top-liked-pages')[0]);
            $('#favourite-groups-rating, #top-liked-pages .form-actions').show();
            hideProgressbar($('#top-liked-pages'));
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
            saveDataToMongoDB(JSON.stringify(modelUsers), 'FavouriteUsers');
            ko.applyBindings(new FavouriteUsersRatingModel(modelUsers), $('#top-liked-users')[0]);
            $('#favourite-users-rating, #top-liked-users .form-actions').show();
            hideProgressbar($('#top-liked-users'));
        }
    });
}

function renderContentRating(contentType) {
    var model = [];
    for (var k = 0; k < likedContent.length; k++) {
        if (likedContent[k].type === contentType) {
            var index = model.push({ rank: 0, content: likedContent[k], liked: [], reposted: [] }) - 1;
        }
    }
    model.sort(function (a, b) {
        return b.content.liked.length - a.content.liked.length;
    });
    for (var i = 0; i < model.length; i++) {
        model[i].rank = (i + 1).toString();
    }
    if (contentType === 'photo') {
        saveDataToMongoDB(JSON.stringify(model), 'PopularPhotos');
        ko.applyBindings(new PhotoRatingModel(model), $('#most-liked-photo')[0]);
        $('#likedphotos-rating, #most-liked-photo .form-actions').show();
        hideProgressbar($('#most-liked-photo'));
    }
    if (contentType === 'post') {
        saveDataToMongoDB(JSON.stringify(model), 'PopularPosts');
        ko.applyBindings(new PostRatingModel(model), $('#most-liked-post')[0]);
        $('#likedposts-rating, #most-liked-post .form-actions').show();
        hideProgressbar($('#most-liked-post'));
    }
}

function renderPostsAndLikesByMonthsGraph() {
    if (wallPosts.length != 0) {
        // var months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        var months = ['Зима', 'Зима', 'Весна', 'Весна', 'Весна', 'Лето', 'Лето', 'Лето', 'Осень', 'Осень', 'Осень', 'Зима'];
//        var startdate = wallPosts[0].date;
//        var enddate = wallPosts[wallPosts.length - 1].date;
        var startdate = likedContent[likedContent.length - 1].content.date ? likedContent[likedContent.length - 1].content.date : likedContent[likedContent.length - 1].content.created;
        var enddate = likedContent[likedContent.length - 1].content.date ? likedContent[likedContent.length - 1].content.date : likedContent[likedContent.length - 1].content.created;
        var dates = [];
        startdate = new Date(startdate * 1000);
        enddate = new Date(enddate * 1000);
        enddate.setMonth(enddate.getMonth() - 1);
        while (startdate >= enddate) {
            switch (startdate.getMonth()) {
                case 0:
                case 1:
                    {
                        dates.push(months[startdate.getMonth()] + " " + (startdate.getFullYear() - 1).toString() + "-" + startdate.getFullYear());
                        break;
                    }
                case 11:
                    {
                        dates.push(months[startdate.getMonth()] + " " + startdate.getFullYear() + "-" + (startdate.getFullYear() + 1).toString());
                        break;
                    }
                default:
                    {
                        dates.push(months[startdate.getMonth()] + " " + startdate.getFullYear());
                        break;
                    }
            }
            startdate.setMonth(startdate.getMonth() - 1);
        }
//        var datesPosts = dates.slice();
        var datesLikes = dates.slice();
//        for (var i = 0; i < wallPosts.length; i++) {
//            var date = new Date(wallPosts[i].date * 1000);
//            switch (date.getMonth()) {
//                case 0:
//                case 1:
//                    {
//                        dates.push(months[date.getMonth()] + " " + (date.getFullYear() - 1).toString() + "-" + date.getFullYear());
//                        break;
//                    }
//                case 11:
//                    {
//                        datesPosts.push(months[date.getMonth()] + " " + date.getFullYear() + "-" + (date.getFullYear() + 1).toString());
//                        break;
//                    }
//                default:
//                    {
//                        datesPosts.push(months[date.getMonth()] + " " + date.getFullYear());
//                        break;
//                    }
//            }
//        }
        for (var i in likedContent) {
            if (likedContent[i].content.created) {
                likedContent[i].content.date = likedContent[i].content.created; 
            }
        }
        likedContent.sort(function (a,b) {
            return a.content.date - b.content.date ;
        });
        console.log(likedContent);
        for (var i = 0; i < likedContent.length; i++) {
                for (var j = 0; j < likedContent[i].liked.length; j++) {
                    var date = new Date(likedContent[i].content.date * 1000);
                    switch (date.getMonth()) {
                        case 0:
                        case 1:
                            {
                                datesLikes.push(months[date.getMonth()] + " " + (date.getFullYear() - 1).toString() + "-" + date.getFullYear());
                                break;
                            }
                        case 11:
                            {
                                datesLikes.push(months[date.getMonth()] + " " + date.getFullYear() + "-" + (date.getFullYear() + 1).toString());
                                break;
                            }
                        default:
                            {
                                datesLikes.push(months[date.getMonth()] + " " + date.getFullYear());
                                break;
                            }
                    }
                }
        }
        //var chartRawDataPosts = groupby(datesPosts, '', datesPosts.length, true);
        var chartRawDataLikes = groupby(datesLikes, '', datesLikes.length, true);
        //chartRawDataPosts = chartRawDataPosts.reverse();
        chartAbsciss = [];
        //chartSeriesPosts = [];
        chartSeriesLikes = [];
        for (var i in chartRawDataLikes) {
            chartAbsciss.push(chartRawDataLikes[i].name);
            //chartSeriesPosts.push(chartRawDataPosts[i].value - 1);
            chartSeriesLikes.push(chartRawDataLikes[i].value - 1);
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
            legend: {enabled: false},
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
                    },
                }
            },
            xAxis: { categories: chartAbsciss, tickInterval: 2, labels: {enabled: false} },
            yAxis: {
                title: '',
                min: 0,
                offset: 5
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

function getLikedMe() {
    getLikedPosts([], 0, []);
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

function getLikedPosts(mas, offset) {
    $.ajax({
        url: "https://api.vk.com/method/wall.get?" + access_token + "&filter=owner&count=100&offset=" + offset + user_id,
        dataType: "jsonp",
        success: function (data) {
            if (offset < data.response[0] && data.response[0] > 0) {
                for (var i = 1; i < data.response.length; i++) {
                        mas.push(data.response[i]);
                        wallPosts.push(data.response[i]);
                        if (data.response[i].likes.count > 0) {
                            likedContent.push({ content: data.response[i], type: 'post', liked: [], reposted: [] });
                        }
                }
                getLikedPosts(mas, offset + 100);
            }
            else {
                var counter = 0;
                if (likedContent.length == 0) {
                    renderContentRating('post');
                    getLikedPhotos([], 0);
                }
                else {
                    getWhoLikedPosts();
                }
            }
        }
    });
}

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
                for (var j = 0; j < data.response.count && j < 1000; j++) {
                    if (likedMeUsers[data.response.users[j]]) {
                        likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
                    }
                    else {
                        likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
                        likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
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
                for (var j = 0; j < data.response.count && j < 1000; j++) {
                    if (likedMeUsers[data.response.users[j]]) {
                        likedMeUsers[data.response.users[j]].reposts.push(likedContent[$(this).data('index')]);
                    }
                    else {
                        likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
                        likedMeUsers[data.response.users[j]].reposts.push(likedContent[$(this).data('index')]);
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
            if (data.error) {
                console.log(user_id);
            }
            if (offset < data.response[0] && data.response[0] > 0) {
                for (var i = 1; i < data.response.length; i++) {
                    if (data.response[i].likes.count > 0) {
                        likedContent.push({ content: data.response[i], type: 'photo', liked: [], reposted: [] });
                    }
                }
                getLikedPhotos(mas, offset + 100);
            }
            else {
                if (likedContent.length == 0) {
                    getLikedVideos([], 0);
                }
                else {
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
                    likedContent[$(this).data('index')].liked = data.response.users;
                    for (var j = 0; j < data.response.count && j < 1000; j++) {
                        if (likedMeUsers[data.response.users[j]]) {
                            likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
                        }
                        else {
                            likedMeUsers[data.response.users[j]] = { reposts: [], liked: [] };
                            likedMeUsers[data.response.users[j]].liked.push(likedContent[$(this).data('index')]);
                        }
                    }
                    if (counter === length - 1) {
                        renderContentRating('photo');
                        getLikedVideos([], 0);
                    }
                }
                counter++;
            }
        });
    }
}

function getLikedVideos(mas, offset) {//, likedData) {
    $.ajax({
        url: "https://api.vk.com/method/video.get?" + access_token + "&offset=" + offset + user_id + "&count=200",
        dataType: "jsonp",
        type: "post",
        success: function (data) {
            if (offset < data.response[0] && data.response[0] > 0) {
                for (var i = 1; i < data.response.length; i++) {
                    mas.push(data.response[i]);
                }
                getLikedVideos(mas, offset + 100);
            }
            else {
                if (mas.length === 0) {
                    renderUsersInfo(likedMeUsers, 0, [], []);
                    renderPostsAndLikesByMonthsGraph();
                    hideProgressbar($('#posts-by-month'));
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
                    renderPostsAndLikesByMonthsGraph();
                    hideProgressbar($('#charts'));
                    renderUsersInfo(likedMeUsers, 0, [], []);
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
}

function PhotoRating(data) {
    this.rank = ko.observable(data.rank);
    this.link = ko.computed(function () {
        return "http://vk.com/id" + data.content.content.owner_id + "?z=photo" + data.content.content.owner_id + "_" + data.content.content.pid;
    }, this);
    this.source = ko.observable(data.content.content.src_big);
    this.whoLikedList = ko.observableArray([]);
    var mappedwhoLikedList = $.map(data.liked, function (item) {
        result = { display: "http://vk.com/id" + item.info.uid, username: item.info.first_name + " " + item.info.last_name }
        return result;
    });
    this.whoLikedList(mappedwhoLikedList.slice(0, 5));
    this.expandLikedList = function () {
        this.whoLikedList(mappedwhoLikedList);
    };
    this.collapseLikedList = function () {
        this.whoLikedList(mappedwhoLikedList.slice(0, 5));
    };
    this.likesCount = ko.observable(data.content.liked.length);
    this.repostsCount = ko.observable(data.content.reposted.length);
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
}

function PostRating(data) {
    this.rank = ko.observable(data.rank);
    this.likesCount = ko.observable(data.content.liked.length);
    this.repostsCount = ko.observable(data.content.reposted.length);
    this.link = ko.computed(function () {
        return "http://vk.com/wall" + data.content.content.to_id + "_" + data.content.content.id;
    }, this);
    this.picsrc = ko.observable();
    this.displayed = ko.computed(function () {
        var result = "";
        if (data.content.content.attachments) {
            switch (data.content.content.attachments[0].type) {
                case "photo":
                    {
                        this.picsrc(data.content.content.attachments[0].photo.src_big);
                        break
                    }
                case "posted_photo":
                    {
                        this.picsrc(data.content.content.attachments[0].posted_photo.src_big);
                        break
                    }
                case "link":
                    {
                        result += data.content.content.attachments[0].link.title; //картинка
                        this.picsrc("/content/images/1341926477_emblem-symbolic-link.png");
                        break
                    }
                case "video":
                    {
                        result += data.content.content.attachments[0].video.title; //картинка
                        this.picsrc("/content/images/avi-icon.png");
                        break
                    }
                case "audio":
                    {
                        result += data.content.content.attachments[0].audio.performer + " - " + data.content.content.attachments[0].audio.title; //img
                        this.picsrc("/content/images/1341926136_Music-Itunes.png");
                        break
                    }
                case "doc":
                    {
                        result += data.content.content.attachments[0].document.title; //img
                        this.picsrc("/content/images/1341923912_onebit_39.png");
                        break
                    }
                case "graffiti": //img
                    {
                        this.picsrc(data.content.content.attachments[0].graffiti.src_big);
                        break
                    }
                case "app": //img
                    {
                        this.picsrc(data.content.content.attachments[0].app.src_big);
                        break
                    }
                case "poll": //img
                    {
                        result += data.content.content.attachments[0].poll.question;
                        this.picsrc("/content/images/1341923929_poll.png");
                        break
                    }
                case "note": //img
                    {
                        result += data.content.content.attachments[0].note.title;
                        this.picsrc("/content/images/1341923983_Notes.png");
                        break
                    }
            }
        }
        else {
            this.picsrc("/content/images/1341923983_Notes.png");
        }
        result += data.content.content.text;
        return result.length > 20 ? result.substring(0, 20) + "..." : result;

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
}

function LinguisticAnalysisModel(model) {
    var self = this;
    self.badLanguageWordsCount = ko.observable(model.badLanguageWordsCount);
    self.uniqueWordsInPosts = ko.observable(model.uniqueWordsInPosts);
    self.uniqueWordsInReposts = ko.observable(model.uniqueWordsInReposts);
    self.topWords = ko.observableArray([]);
    var topWordsArray = [];
    for (var i = 1; i <= model.topWords.length - 1; i += 3) {
        topWordsArray.push({ firstWord: model.topWords[i - 1].name + ' - ' + model.topWords[i - 1].value, secondWord: model.topWords[i].name + ' - ' + model.topWords[i].value, thirdWord: model.topWords[i + 1].name + ' - ' + model.topWords[i + 1].value });
    }
    self.topWords(topWordsArray);
    self.badLanguagePosts = ko.observableArray([]);
    model.badLanguagePosts = model.badLanguagePosts.filter(function (itm, i, a) { return i == a.indexOf(itm); });
    var mappedBadLanguagePosts = $.map(model.badLanguagePosts, function (item) {
        return { link: "http://vk.com/wall" + item.to_id + "_" + item.id, text: item.text };
    });
    self.badLanguagePosts(mappedBadLanguagePosts);
}

function CurrentUserModel(model) {
    var self = this;
    self.user_name = ko.computed(function () {
        return model.first_name + " " + model.last_name;
    }, this);
    self.photo_src = ko.observable(model.photo_rec);
    self.link = ko.computed(function () {
        return "http://vk.com/id" + model.uid;
    }, this);

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

function recalculateRating() {
    localStorage['user_id'] = "";
    location.href = "/Like/Me";
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
                localStorage['user_link'] = "vk.com/id" + data.response[0].uid;
                localStorage['user_name_gen'] = data.response[0].first_name + " " + data.response[0].last_name;
                location.href = "/Like/Me";
            }
        }
    });
}

$(function () {
    var lang = getCookie("lang");
    if (lang) {
        $('li.dropdown>a span').text($('.dropdown-menu a[data-lang=' + lang + ']').text());
    }
    if (access_token) {

        access_token = "access_token=" + access_token;

        //console.log(access_token);

        if (lang == 'en')
            $('.pull-right.nav').append('<li><a href="/" onclick="deleteCookie(\'access_token\')">Log off</a></li>');
        else
            $('.pull-right.nav').append('<li><a href="/" onclick="deleteCookie(\'access_token\')">Выйти</a></li>');

        $('.auth, .image-main-wrapper, #header').hide();

        if (user_link) {
            $('#user-link').val(user_link);
        }

        if (user_id) {
            $($('.container .nav-pills li')[1]).css('display', 'none');
            $.ajax({
                url: "https://api.vk.com/method/users.get?" + access_token + "&uids=" + localStorage['user_id'].split('=')[1] + "&fields=photo_rec",
                dataType: "jsonp",
                success: function (data) {
                    var model = data.response[0];
                    ko.applyBindings(new CurrentUserModel(model), $('#current-user')[0]);
                }
            });
            $('#current-user').show();
        }
        else {
            $($('.container .nav-pills li')[1]).css('display', true);
            $('#current-user').hide();
        }

        $('.container section .well')
			.append('<p class="progressbar"><img src="/content/images/progress.gif" /></p>');

        $('#user-link').keypress(function (key) {
            var link = $(this).val();
            if (key.keyCode === 13) {
                if (link.indexOf('vk.com') != -1) {
                    $('#search-warning').hide();
                    var id = link.substr(link.lastIndexOf('/') + 1);
                    setOwnerId(id);
                }
                else {
                    $('#search-warning').toggle();
                }
            }
        })

        $('.small-chart-container').click(function(item){
            $('.small-chart-container').removeClass('active');
            var targetId;
            if ($(item.target).hasClass('small-chart-container')) {
                targetId = $(item.target).attr("id");
                $(item.target).addClass('active');
            }
            else {
                targetId = $(item.target).parents('.small-chart-container').attr("id");
                $(item.target).parents('.small-chart-container').addClass('active');
            }
            $('#target-chart-container').empty()
            switch (targetId){
                case 'contentType-chart':{
                    contentTypeChart.options.chart.renderTo = 'target-chart-container';
                    contentTypeChart.options.chart.width = '528';
                    contentTypeChart.options.chart.height = '313';
                    contentTypeChart.options.plotOptions.pie.dataLabels.enabled = true;
                    contentTypeChart.options.tooltip.style.padding = '3';
                    var newchart = new Highcharts.Chart(contentTypeChart.options);
                    break;
                }
                case 'posts-by-month-chart':{
                    postsAndLikesChart.options.chart.renderTo = 'target-chart-container';
                    postsAndLikesChart.options.chart.width = '528';
                    postsAndLikesChart.options.chart.height = '313';
                    postsAndLikesChart.options.legend.enabled = true;
                    postsAndLikesChart.options.tooltip.style.padding = '3';
                    var newchart = new Highcharts.Chart(postsAndLikesChart.options);
                    break;
                }
                case 'group-reposts-chart':{
                    groupRepostsChart.options.chart.renderTo = 'target-chart-container';
                    groupRepostsChart.options.chart.width = '528';
                    groupRepostsChart.options.chart.height = '313';
                    groupRepostsChart.options.legend.enabled = true;
                    groupRepostsChart.options.tooltip.style.padding = '3';
                    var newchart = new Highcharts.Chart(groupRepostsChart.options);
                    break;
                }
                case 'hobbies-chart':{
                    $('#target-chart-container').empty()
                    $('#target-chart-container').append("<img src='http://entropiya-blog.ru/wp-content/uploads/2012/03/6312.jpg' />");
                    break;
                }
            }
        });
    }
    else {
        $('.auth, .image-main-wrapper, #header').show();
        $('.body-info, .subhead.custom, .navbar-search').hide();
    }
});
