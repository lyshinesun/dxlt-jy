/*
 * vlm.js
 * out_api:common assembly
 * author:qzz
 * 2016-12-28
 * ver:1.0
 */
(function (e, t) {
    var n = n || (function (n) {
             var _api = location.protocol + "//192.168.2.214:8001/api/GetServiceApiResult",
                 serverAddr = "http://192.168.2.214:8011/dxsky/",
                lStorage = window.localStorage,
                sStorage = window.sessionStorage,
                _Utils = {
                    //补零
                    format_add_zero: function (time) {
                        if (parseInt(time) < 10) {
                            return "0" + time;
                        } else {
                            return time;
                        }
                    },
                    trim: function (str) {
                        return str = str.replace(/(^\s*)|(\s*$)/g, "")
                    },
                    //格式化日期
                    format_date: function (dtime, format) {
                        var stringTime = dtime.replace('-', "/").replace('-', "/").replace('T', " ");
                        var newDate = new Date(stringTime);
                        var year = newDate.getFullYear();
                        var yy = year.toString(),
                            yy = yy.substr(-2),
                            month = parseInt(newDate.getMonth()) + 1,
                            day = parseInt(newDate.getDate());
                        var hour = newDate.getHours(),
                            minutes = parseInt(newDate.getMinutes()),
                            seconds = parseInt(newDate.getSeconds());
                        month = month < 10 ? '0' + month : month;
                        day = day < 10 ? '0' + day : day;
                        hour = hour < 10 ? '0' + hour : hour;
                        minutes = minutes < 10 ? '0' + minutes : minutes;
                        seconds = seconds < 10 ? '0' + seconds : seconds;
                        var timeStr;
                        format = typeof format == 'undefined' ? '' : format;
                        if (format == 'YmdHi') {
                            timeStr = year + '' + month + '' + day + '' + hour + '' + minutes;
                        } else if (format == 'YmdHis') {
                            timeStr = year + '' + month + '' + day + '' + hour + '' + minutes + '' + seconds;
                        } else if (format == 'Ymd') {
                            timeStr = year + '' + month + '' + day;
                        } else if (format == 'ymd') {
                            timeStr = yy + '' + month + '' + day;
                        } else if (format == 'md') {
                            timeStr = month + '月' + day + "日";
                        } else if (format == 'cymd') {
                            timeStr = year + '年' + month + '月' + day + "日";
                        } else if (format == 'hm') {
                            timeStr = hour + '' + minutes
                        } else {
                            timeStr = month + '' + day;
                        }
                        return timeStr;
                    },

                    //当天00:00:00
                    currentDay: function () {
                        var d = new Date();
                        d.setHours(0, 0, 0);
                        var month = d.getMonth() + 1;
                        var day = d.getDate();
                        var hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
                        var minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
                        var second = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();

                        if (month < 10) {
                            month = "0" + month;
                        }
                        if (day < 10) {
                            day = "0" + day;
                        }
                        var val = d.getFullYear() + '' + month + '' + day + '' + hour + '' + minute + '' + second;
                        return val;
                    },

                    //当月1号00:00:00
                    currentMonth: function () {
                        var d = new Date();
                        d.setDate(1);
                        d.setHours(0, 0, 0);
                        var month = d.getMonth() + 1;
                        var day = d.getDate();
                        var hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
                        var minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
                        var second = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();

                        if (month < 10) {
                            month = "0" + month;
                        }
                        if (day < 10) {
                            day = "0" + day;
                        }
                        var val = d.getFullYear() + '' + month + '' + day + '' + hour + '' + minute + '' + second;
                        return val;
                    },

                    //当年1月1号0000
                    currentYear: function () {
                        var d = new Date();
                        var val = d.getFullYear() + '0101000000';
                        return val;
                    },

                    //明年1月1号0000
                    nextYear: function () {
                        var d = new Date();
                        var val = (d.getFullYear() + 1) + '0101000000';
                        return val;
                    },

                    //格式验证
                    validate: {
                        isNoEmpty: function (obj) {
                            if (obj == "") {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    },

                    //根据某一数值排序
                    sortArr: function (arr, val) {
                        for (var i = 0; i < arr.length - 1; i++) {
                            var maxIndex = i;
                            for (var j = i + 1; j < arr.length; j++) {
                                var maxVal = arr[maxIndex][val];
                                var curVal = arr[j][val];
                                if ($.isNumeric(maxVal) && $.isNumeric(curVal) && maxVal < curVal) {
                                    maxIndex = j;
                                }
                            }
                            if (maxIndex != i) {
                                var tem = arr[maxIndex];
                                arr[maxIndex] = arr[i];
                                arr[i] = tem;
                            }
                        }
                        return arr;
                    },

                    //分页
                    pagination: function (containerId, pageObj, searchObj) {
                        var totalCount = pageObj.totalCount;
                        var perPageCount = pageObj.perPageCount ? pageObj.perPageCount : 10;
                        var callback = pageObj.callback;
                        var currentPage = pageObj.currentPage;
                        $("#" + containerId).pagination(totalCount, {
                            items_per_page: perPageCount,
                            num_display_entries: 6,
                            current_page: currentPage,
                            num_edge_entries: 1,
                            callback: pageselectCallback
                        });

                        function pageselectCallback(page_id, jq) {
                            $.extend(searchObj, {
                                "page": page_id + 1,
                                "rows": perPageCount
                            });
                            callback(searchObj, false);
                        }

                    },

                    //前端静态分页
                    Jpage: function (containerId, pageObj) {
                        var totalCount = pageObj.totalCount;
                        var perPageCount = pageObj.perPageCount ? pageObj.perPageCount : 10;
                        var callback = pageObj.callback;
                        $("#" + containerId).pagination(totalCount, {
                            items_per_page: perPageCount,
                            num_display_entries: 6,
                            current_page: 0,
                            num_edge_entries: 1,
                            callback: pageselectCallback
                        });

                        function pageselectCallback(page_id, jq) {
                            callback(page_id);
                        }

                    }
                },
                loadJson = function (url, data, mycallback, async, encryption, isShowLoading) {

                    data = JSON.parse(data);
                    data = JSON.stringify(data);

                    function isObject(value) {
                        var type = typeof value;
                        return !!value && (type == 'object' || type == 'function');
                    }

                    /**
                     * mycallback
                     * 1. 必传success<function>，服务器返回调用success
                     * 2. 可选{success, error}<object>，服务器返回调用mycallback，服务器失败调用mycallback.error
                     */
                    if (isObject(mycallback)) {
                        var error = mycallback.error;
                    }

                    /**
                     * 默认传入undefined，全屏显示loading
                     * 传入true，不全屏显示loading
                     * 传入'nothing'，什么也不显示自由控制
                     *
                     * ajaxStop结束后，$(window).off('ajaxStart')结束全局ajax
                     *
                     * @param {boolean|null|undefinde|'nothing'} isShowLoading
                     */
                    if (isShowLoading === true) {
                        $(t).ajaxStart(function () {
                            $("#preloader").hide();
                            $('#status').hide();
                        }).ajaxStop(function () {
                            $("#preloader").hide();
                            $('#status').show();
                            $(t).off('ajaxStart');
                            $(t).off('ajaxStop');
                        });

                    } else if (isShowLoading === undefined || isShowLoading === null || isShowLoading === false) {
                        // 1.8以后，ajaxStart要绑定到document
                        $(t).ajaxStart(function () {
                            $("#preloader").show();
                            $('#status').show();
                        }).ajaxStop(function () {
                            $("#preloader").hide();
                            $('#status').show();
                            $(t).off('ajaxStart');
                            $(t).off('ajaxStop');
                        });

                    } else if (isShowLoading === 'nothing') {
                    }
                    if (async != undefined && async == true) {
                        $.ajaxSetup({
                            async: false
                        });
                    }
                    ;
                    var apiUrl = url == "" ? _api : url;
                    $.ajax({
                        type: "post",
                        dataType: 'json',
                        // type: "get",
                        url: apiUrl + '?rnd=' + Math.random(),
                        timeout: 1000 * 60 * 5,
                        data: data,
                        contentType: 'application/json;charset=utf-8',
                        beforeSend: function (xhr) {
                            //xhr.setRequestHeader("Accept-Encoding", "gzip");
                            //xhr.setRequestHeader('Content-Type','application/json');

                        },
                        success: function (jsondata) {
                            mycallback(jsondata);
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            /**
                             * @param {Object} XMLHttpRequest
                             * @param {String} textStatus
                             * @param {String} errorThrown
                             *
                             * error = mycallback.error
                             */
                            if (textStatus == 'timeout') {
                                alert("网络不给力，刷新重试！");
                                window.location.reload();
                            } else if (textStatus == 'error') {
                                error && error(arguments);
                            }
                        }
                    });
                    $.ajaxSetup({
                        async: true
                    });
                },
                _checklogin = function (c) {
                    if (!sStorage.userid || sStorage.userid == '' || sStorage.login != 1) { //need login
                        window.location.href = c;
                        return false;
                    } else {
                        return true;
                    }

                };
            //out api
            return {
                api: _api,
                serverAddr: serverAddr,
                loadJson: loadJson,
                checkLogin: _checklogin,
                Utils: _Utils
            };
        })();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = n;
    }
    if (typeof ender === "undefined") {
        this.vlm = n;
    }
    if (typeof define === "function" && define.amd) {
        define("vlm", ['jquery'], function ($) {
            return n;
        });
    }
}).call(this, window, document);












