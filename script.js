(function() {

        function edaby(opts) {
            var that = this;
            var opts = $.extend({
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
                        count: 5,
                        time: 200
                    } //0.2s
                ],
                log: function(msg) {
                    console.log(msg);
                },
                clickBuffer: 2 //value that determine when click should appeared (max vote count - tryToClickCount). Should be equal to count of running scripts.
            }, opts);

            //current send check request frequency in milliseconds
            var currentFreq = opts.frequencyRequests[opts.frequencyRequests.length - 1];
            var closeToWinDiv;
            var updateEvery;

            this.init = function() {
                $('.carousel,.carousel ul').css({
                    'display': 'inline',
                    'position': 'initial'
                });
                $('body').prepend('<div id="closeToWin" /><div id="updateEvery"/>');
                closeToWinDiv = $('#closeToWin');
                updateEvery = $('#updateEvery');
            };

            this.start = function() {
                setTimeout(function() {
                    try {
                        that._doRequest();
                    } catch (e) {
                        opts.log(e + '');
                    }
                }, currentFreq.time)
            }

            this._doRequest = function() {

                $.get(opts.siteUrl, function(response) {

                        var voteItemArray = $('.line-img', response);
                        var itemsArr = [];

                        for (var i = 0; i < voteItemArray.length; i++) {
                            var voteItem = voteItemArray[i];
                            var title = $('p', voteItem);
                            var titleText = $(title).text();

                            if (that._isUnknownTitle(titleText)) {
                                opts.log('warning. unexpected title' + titleText);
                                return;
                            }
                            var clickCountStr = titleText.split(' ');
                            var clickCount = parseInt(clickCountStr[0]);
                            var maxCount = parseInt(clickCountStr[2]);

                            itemsArr.push({
                                cur: clickCount,
                                max: maxCount
                            });

                            if (clickCount >= maxCount - opts.clickBuffer) {
                                that._emulateClickRequest(voteItem);
                                that._startTimeout(10);
                                return;
                            }
                        }

                        that._showStatisticInfo(itemsArr);
                        that.start();
                    };

                }

                this._emulateClickRequest = function(clickToEl) {
                    opts.log("Well, let's try...");
                    var clickHref = $('a', clickToEl);
                    var rId = parseInt($(clickHref).attr('rel'));
                    $.post(opts.voteUpUrl, {
                            act: 'crazyg',
                            r: rId
                        },
                        function(result) {
							var isWin = that._isUnknownTitle(result);
                            var prize = that._parsePrize($(clickHref).attr('onmouseover') + '');

                            if (isWin) {
                                opts.log('You are awesome! You win : ' + prize + result + titleText)
                            } else {
                                opts.log.('Эх, почти...почти.' + prize + result + titleText);
                            }
                        });

                }
                this._parsePrize = function(str) {
                    var regexp = /и получи (.*?)(?=<br>)/g;
                    var match = regexp.exec(str);
                    return match[1];
                }
                this._showStatisticInfo = function(itemsArr) {

                    itemsArr.sort(function(a, b) {
                        return a.max - a.cur > b.max - b.cur ? 0 : 1;
                    });
                    var closeToWin = itemsArr.pop();
                    for (var i = opts.frequencyRequests.length - 1; i >= 0; i--) {
                        if ((closeToWin.max - closeToWin.cur) < opts.frequencyRequests[i].count) {
                            currentFreq = opts.frequencyRequests[i];
                            break;
                        }
                    }
                    $(closeToWinDiv).html('Кликов до ближайшего : <b>' + (closeToWin.max - closeToWin.cur) + '</b>');
                    $(updateEvery).html('Обновлятся каждые : <b>' + (currentFreq.time / 1000) + ' сек.</b>');
                }

                this._isUnknownTitle = function(str) {
                    return str.indexOf('кликов') == -1 && str.indexOf('Ожидайте') == -1
                };


                this._startTimeout = function(min) {
                    setTimeout(function() {
                        that.start();
                    }, 60 * 1000 * min);
                }
            }

            var eda = new edaby({
                log: function(msg) {
                    $('body').prepend(msg + '<br />')
                }
            }).init();
            eda.start();

        })();