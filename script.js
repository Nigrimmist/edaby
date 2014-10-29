(function() {

    function edaby(opts) {
        var that = this;
        opts = $.extend({
            siteUrl: 'http://www.eda.by/news/113.html',
            voteUpUrl: 'http://www.eda.by/enter.php',
            frequencyRequests: [ // send request frequency matrix
                {
                    count: 10000,
                    time: 1000 * 5
                }, //5s
                {
                    count: 30,
                    time: 1000
                }, //1s
                {
                    count: 10,
                    time: 500
                }, //0.5s
                {
                    count: 6,
                    time: 200
                } //0.2s
            ],
            log: function(msg) {
                console.log(msg);
            },
            clickBuffer: 1, //value that determine when click should appeared (max vote count - tryToClickCount). Should be equal to count of running scripts.
            blackItemIdList: [],
            clickForVoteBeforeClosestClickCount: 20, //for faster finish!
			onWin : null,
			whiteList : []
			}, opts);

        var pauseMin = 10;
        //current send check request frequency in milliseconds
        var currentFreq = opts.frequencyRequests[opts.frequencyRequests.length - 1];
        var closeToWinDiv;
        var updateEvery;
        var lastClickDiv;
        var lastClickTime = null;
		var lastLoggedClick = 0;
        this.init = function() {
            $('.carousel,.carousel ul').css({
                'display': 'inline',
                'position': 'initial'
            });
            $('body').prepend('<div id="closeToWin" /><div id="updateEvery"/><div id="lastClick"/>');
            closeToWinDiv = $('#closeToWin');
            updateEvery = $('#updateEvery');
            lastClickDiv = $('#lastClick');
            that._startLastClickTimeLog();
        };

        this.start = function() {
            setTimeout(function() {
                try {
                    that._doRequest();
                } catch (e) {
                    opts.log(e + '');
                }
            }, currentFreq.time);
        };

        this._doRequest = function() {

            $.get(opts.siteUrl+new Date().getTime(), function(response) {
                var tUniqueIdArr = [];
                var voteItemArray = $.grep($('.line-img', response),
                    function(el) {
                        var id = parseInt($('a', el).attr('rel'));
						console.log(id,(opts.whiteList.length>0 && $.inArray(id, opts.whiteList) != -1))
						var shouldBeAdded = false;							
						if(opts.whiteList.length>0) 
							shouldBeAdded = $.inArray(id, opts.whiteList) != -1;
						else 
							shouldBeAdded = $.inArray(id, opts.blackItemIdList) == -1;
						
                        if (shouldBeAdded) {
                            //check for unique
                            if ($.inArray(id, tUniqueIdArr) == -1) {
                                tUniqueIdArr.push(id);
                                return true;
                            }
                        }						
                        return false;
                    }
                );
                var itemsArr = [];
                for (var i = 0; i < voteItemArray.length; i++) {
                    var voteItem = voteItemArray[i];
                    var titleText = $('p', voteItem).text();
                    var clickCountStr = titleText.split(' ');
                    var clickCount = parseInt(clickCountStr[0]);
                    var maxCount = parseInt(clickCountStr[2]);

                    itemsArr.push({
                        cur: clickCount,
                        max: maxCount,
                        node: voteItem
                    });			
					
					
                    if (clickCount >= maxCount - opts.clickBuffer) {
						opts.log('catched '+clickCount);
                        that._emulateClickRequest(voteItem, false);
                        that._startTimeout(pauseMin);
                        break;
                    }
                }

                var stats = that._showStatisticInfo(itemsArr);
				
                if (stats.totalToClick > opts.clickForVoteBeforeClosestClickCount && !that._isPaused()) {
                    that._emulateClickRequest(stats.closestToClickNode, true);
                    that._startTimeout(pauseMin);
                }
                that.start();
            });
        };

        this._emulateClickRequest = function(clickToEl, isVoteClick) {
            var clickHref = $('a', clickToEl);
            var titleText = $(clickHref).text();
            var rId = parseInt($(clickHref).attr('rel'));
            lastClickTime = new Date();
            $.post(opts.voteUpUrl, {
                    act: 'crazyg',
                    r: rId
                },
                function(result) {
                    if (!isVoteClick) {
                        var isWin = that._isUnknownTitle(result);
                        var prize = that._parsePrize($(clickHref).attr('onmouseover') + '');

                        if (isWin) {
							if(opts.onWin!=null){
								var accName = $.trim($('.hellouser').html().split('<br>')[1]);
								opts.onWin(accName);							
							}
                            opts.log('You are awesome! You win : Prize : ' + prize +' response : '+ result +'. Clicked on : '+ titleText);
                        } else {
                            opts.log('Эх, почти...почти.' + prize +' response : '+ result +'. Clicked on : '+ titleText);
                        }
                    }
                });

        };
        this._parsePrize = function(str) {
            var regexp = /и получи (.*?)(?=<br>)/g;
            var match = regexp.exec(str);
            return match[1];
        };
        this._showStatisticInfo = function(itemsArr) {

            itemsArr.sort(function(a, b) {
                return a.max - a.cur > b.max - b.cur ? 0 : 1;
            });
            var closeToWin = itemsArr.pop();
            var totalToClick = closeToWin.max - closeToWin.cur;
            for (var i = opts.frequencyRequests.length - 1; i >= 0; i--) {
                if (totalToClick < opts.frequencyRequests[i].count) {
                    currentFreq = opts.frequencyRequests[i];
                    break;
                }
            }
            var closestTitle = that._parsePrize($('a', closeToWin.node).attr('onmouseover'));
            $(closeToWinDiv).html('Кликов до ближайшего : <b>' + totalToClick + '</b> (' + closestTitle + ')');
            $(updateEvery).html('Обновлятся каждые : <b>' + (currentFreq.time / 1000) + ' сек.</b>');
            return {
                totalToClick: totalToClick,
                closestToClickNode: closeToWin.node
            };
        };

        this._isUnknownTitle = function(str) {
            return str.indexOf('кликов') == -1 && str.indexOf('Ожидайте') == -1 && str.indexOf('разыграно') == -1;
        };

        var isPaused = false;
        this._startTimeout = function(min) {
            isPaused = true;
            setTimeout(function() {
                isPaused = false;
            }, 60 * 1000 * min);
        };

        this._isPaused = function() {
            return isPaused;
        };

        this._startLastClickTimeLog = function() {
            setInterval(function() {
                if (lastClickTime != null) {
                    $(lastClickDiv).html('Последний клик : <b>' + that._timeAgoFromEpochTime(lastClickTime.getTime() / 1000) + '</b> назад');
                }
            }, 1000)
        }

        this._timeAgoFromEpochTime = function(epoch) {
            var secs = ((new Date()).getTime() / 1000) - epoch;
            Math.floor(secs);
            var min = Math.floor(secs / 60)
            return ((min > 0 ? (min + 'м. ') : '') + (Math.floor(secs - min * 60)) + 'сек.')

        }

    }

function SmsSender(options){
	options = $.extend({
		login : '',
		pwd : '',
		number : ''
	},options)
	
	this.send = function(msg){
		$.get('https://lcab.sms-uslugi.ru/lcabApi/sendSms.php?login='+options.login+'&password='+options.pwd+'&txt='+msg+'&to='+options.number);
	}
	
	}

	
	var sms = new SmsSender({login:'',pwd:'',number:''});
    var eda = new edaby({
        log: function(msg) {
            $('body').prepend(msg + '<br />');
        },
        clickBuffer: 3,
        blackItemIdList: [
            19, //караоке о_О
            21, //фитнесс 
			20, //десерт
        ],
		whiteList : [24,25],
		onWin : function(winAccName){
			sms.send('edaby win '+winAccName);
		}
    });
    eda.init();
    eda.start();

})();