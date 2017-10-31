new Vue({
    el: '#powerMatrix',
    data: {
        dialog_psunit: {
            psType: '',//电站类型：1: 地面式
            psScheme: '2',//电站方案
            deviceType: '1',//psScheme==2(组串式),deviceType=17(单元); 其他,deviceType=1(逆变器);
            dateType: '1', //等效小时、发电量 排名  1:日  2:月  3:年
            psId: ""
        },
        curYearGen: {
            pageSize: 15,//每页显示条目数
            currentPage: 1, //当前页
            rowCount: 0,//总条目数
            pageCount: 0,//总页数
            uuid_index: "", //一个具体设备的uuid，用来查询该设备下面的所有设备
            psTemType: "2", //箱变和逆变器矩阵判断
            deviceArr: [] //所有电站设备数组
        },
        items: [], //tab小图标
    },
    methods: {
        //关闭时 显示电站详细信息
        toDetailInfo: function () {
            var url = "dialog/dialog_powerDetail.html?ps_id=" + this.dialog_psunit.ps_Id;
            $("#equalHourFm", parent.document).attr("src", url);
        },

        //加载所有电站设备
        loadPsAllDevice: function () {
            var iFrameSearch = window.location.search.substring(1),
                stationid = iFrameSearch.split('=')[1].toLowerCase();
            this.dialog_psunit.ps_Id = stationid; //记录电站id
            $(".showm_bottom .loadingDiv").show();
            var _this = this,
                dateType = this.dialog_psunit.dateType,
                startDateStr = '',
                endDateStr = '';
            $("#deviceUl").html('');
            switch (dateType) {
                case '1':
                    dateStr = 'month';
                    var dateNum = _this.getInputDate($('#dateInput').val());
                    startDateStr = _this.getInputDate(dateNum) + '000000';
                    var year = dateNum.substring(0, 4);
                    var month = dateNum.substring(4, 6);
                    var day = dateNum.substring(6);
                    if (month < 10) {
                        month = month.substring(1);
                    }
                    var date = new Date();
                    date.setFullYear(year, month - 1, day);
                    date.setDate(date.getDate() + 1);
                    day = date.getDate();
                    var Month = date.getMonth() + 1;
                    endDateStr = date.getFullYear() + '' + dealDate(Month) + '' + dealDate(day) + '000000';
                    break;
                case '2':
                    dateStr = 'year';
                    var dateNum = _this.getInputDate($('#dateInput').val());
                    var date = new Date();
                    var year = dateNum.substring(0, 4);
                    var month = dateNum.substring(4);
                    if (month < 10) {
                        month = month.substring(1);
                    };
                    date.setFullYear(year, month, 0);
                    var day = date.getDate();
                    startDateStr = dateNum + '01000000';
                    endDateStr = dateNum.substring(0, 6) + day + '000000';
                    break;
                case '3':
                    dateStr = 'year';
                    startDateStr = $('#dateInput').val() + '0101000000';
                    endDateStr = (Number($('#dateInput').val()) + 1) + '0101000000';
                    break;
                default :;
            }

            var devid = '', ischild = '';
            if (this.curYearGen.psTemType == 1) {
                devid = this.curYearGen.uuid_index;
                ischild = '1';
            }
            var Parameters = {
                "parameters": {
                    "ctype": "1",
                    "sorttype": "1",
                    "sort": "1",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "1000",
                    "stationid": this.dialog_psunit.ps_Id,
                    "devid": devid,
                    "ischild": ischild
                },
                "foreEndType": 2,
                "code": "30000002"
            };

            console.log(Parameters);
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                _this.items.length=0; //先清空每页内容
                _this.curYearGen.deviceArr.length = 0;  //先清空数据
                _this.curYearGen.pageCount = 0;  //先清空页数按钮
                if (res.success) {
                    var result = res.data,
                        devNameArr = [];
                    for (var i = 0; i < result.length; i++) {
                        devNameArr.push(result[i].fd_name);
                        _this.curYearGen.deviceArr.push({
                            fd_dev_id: result[i].fd_dev_id,
                            pr: result[i].pr,
                            fd_name: result[i].fd_name,
                        });
                    }

                    _this.curYearGen.rowCount = result.length;
                    _this.curYearGen.pageCount = _this.curYearGen.rowCount / _this.curYearGen.pageSize;
                    var remainder = _this.curYearGen.rowCount % _this.curYearGen.pageSize;
                    if (remainder != 0) {
                        _this.curYearGen.pageCount = parseInt(_this.curYearGen.pageCount) + 1;
                    }
                    if (_this.curYearGen.pageCount > 1) {
                        _this.showPageantion();
                        $('#pagenation').show();
                    }else{
                        $('#pagenation').hide();
                    }
                    _this.curYearGen.currentPage = 1;
                    _this.loadPsCurPageDevice();
                }
            })
        },

        //绘制电站设备
        loadPsCurPageDevice: function () {
            var _this = this;
            $(".showm_bottom .loadingDiv").show();
            var startIndex = this.curYearGen.pageSize * (this.curYearGen.currentPage - 1);
            var endIndex = this.curYearGen.currentPage * this.curYearGen.pageSize;
            this.isPageArrowAvilable();
            var lis = "";
            var j = 0;
            for (var i = startIndex; i < this.curYearGen.deviceArr.length && i < endIndex; i++) {
                var obj = this.curYearGen.deviceArr[i];
                var pr = obj.pr;
                var c = this.getClassByPr_new(parseFloat(pr));
                /*c = "deviceNice";//演示写死
                 pr = (85-((i%2)==0?(j*1):(j*0.5)));//演示写死
                 if(pr<75){
                 c = "deviceFine";//演示写死
                 }*/
                j++;
                if (this.curYearGen.psTemType == 2) {
                    lis += '<li data-uuid="' + obj.fd_dev_id + '" class="' + c + '">' +
                        '<h3 style="align-self: center">' + pr + '%</h3>' +
                        '<h5 style="align-self: center">' + obj.fd_name + '</h5>' +
                        '</li>';
                } else {
                    lis += '<li class="' + c + '">' +
                        '<h3 style="align-self: center">' + pr + '%</h3>' +
                        '<h5 style="align-self: center">' + obj.fd_name + '</h5>' +
                        '</li>';
                }
            }
            $(".showm_bottom .loadingDiv").hide();
            $("#deviceUl").html(lis);
            $("#deviceUl >li").click(function () {  //箱变矩阵点击
                if ($(this).attr('data-uuid')) {
                    var uuid = $(this).attr('data-uuid');
                    _this.showInveter(uuid);
                }
            });

            if (this.curYearGen.psTemType == 2) {
                $("#dialogTile").html("箱变矩阵");
                $("#deviceUl li").css("cursor", "pointer");
            } else {
                $("#dialogTile").html("逆变器矩阵");
                $("#deviceUl li").css("cursor", "normal");
            }
        },
        //分页下方小图标根据数据初始化
        showPageantion: function () {
            for (var i = 0; i < this.curYearGen.pageCount; i++) {
                if (i == 0) {
                    this.items.push({'active': true});
                } else {
                    this.items.push({'active': false});
                }
            }
        },
        //当前页选中效果
        showCurPage: function () {
            var lis = $("#pagenation li");
            $("#pagenation li").removeClass("on");
            $(lis[this.curYearGen.currentPage - 1]).addClass("on");
        },
        //点击小图标tab
        changePage: function (e, index) {
            if (!$(e.target).hasClass('on')) {
                this.curYearGen.currentPage = index + 1;
                this.loadPsCurPageDevice();
                this.showCurPage();
            }
        },

        getClassByPr_new: function (val) {
            if ($.isNumeric(val)) {
                if (this.dialog_psunit.psType == 3) {//分布式电站
                    if (val >= 80) {
                        return "deviceNice";
                    } else if (val >= 75) {
                        return "deviceFine";
                    } else if (val >= 70) {
                        return "deviceCommon";
                    } else if (val >= 65) {
                        return "deviceWorse";
                    } else {
                        return "deviceBad";
                    }
                } else {
                    if (val >= 85) {
                        return "deviceNice";
                    } else if (val >= 80) {
                        return "deviceFine";
                    } else if (val >= 75) {
                        return "deviceCommon";
                    } else if (val >= 70) {
                        return "deviceWorse";
                    } else {
                        return "deviceBad";
                    }
                }
            }
            return "deviceNoState";
        },

        //箭头分页
        arrowChangePage: function () {
            if (event.target == document.getElementById("left_max_btn") && this.curYearGen.currentPage > 1) {
                this.curYearGen.currentPage--;
            } else if (event.target == document.getElementById("right_max_btn")) {
                this.curYearGen.currentPage++;
            }
            this.showCurPage();
            this.loadPsCurPageDevice();
            this.isPageArrowAvilable();
        },

        initTime: function () {
            var daybegin = new Date();
            var year = daybegin.getFullYear();
            var month = daybegin.getMonth() + 1;
            var date = daybegin.getDate();
            var hour = daybegin.getHours();
            var min = daybegin.getMinutes();
            var month1 = month >= 10 ? month : ("0" + month);
            var date1 = date >= 10 ? date : ("0" + date);
            var thisDate = year + "/" + month1 + "/" + date1;
            if (this.dialog_psunit.dateType == "2") {
                thisDate = year + "/" + month1;
            } else if (this.dialog_psunit.dateType == "3") {
                thisDate = year + "";
            }
            $("#dateInput").val(thisDate);
            this.isIncreaseDateAvailable(this.dialog_psunit.dateType, thisDate, false);
        },

        //根据时间类型type 刷新数据 1:日  2:月  3:年
        showEqHourData: function (e) {
            var type = '';
            $('.time_menunav ul li').removeClass("on");
            if ($(e.target).attr('dateTabType') == 1 || $(e.target).attr('dateTabType') == undefined) {
                $('.time_menunav ul li').eq(0).addClass("on");
                type = '1';
            } else if ($(e.target).attr('dateTabType') == 2) {
                $('.time_menunav ul li').eq(1).addClass("on");
                type = '2';
            } else if ($(e.target).attr('dateTabType') == 3) {
                $('.time_menunav ul li').eq(2).addClass("on");
                type = '3';
            }
            this.dialog_psunit.dateType = type;
            this.initTime();
            this.setDateInputFormat();  //时间input绑定WdatePicker
            $('#right_min_btn').removeClass('active');
        },

        //判断能否增长日期 val(eg:2016-01-01)
        isIncreaseDateAvailable: function (type, val, isInner) {
            var now = new Date();
            if (type == 1) {//日
                if (now.Format("yyyyMMdd") >= val.replace(/\//g, "")) {
                    this.showIncreaseDate = true;
                } else {
                    this.showIncreaseDate = false;
                }
            } else if (type == 2) {//月
                if (now.Format("yyyyMM") >= val.replace(/\//g, "")) {
                    this.showIncreaseDate = true;
                } else {
                    this.showIncreaseDate = false;
                }
            } else if (type == 3) {//年
                if (now.Format("yyyy") >= val.replace(/\//g, "")) {
                    this.showIncreaseDate = true;
                } else {
                    this.showIncreaseDate = false;
                }
            }

            if (this.showIncreaseDate) {  //可以增加
                $("#dateInput").val(val);
                if (type == 1) {
                    if (now.Format("yyyyMMdd") == val.replace(/\//g, "")) {
                        $('#right_min_btn').removeClass('active');
                    } else {
                        $('#right_min_btn').addClass('active');
                    }
                } else if (type == 2) {
                    if (now.Format("yyyyMM") == val.replace(/\//g, "")) {
                        $('#right_min_btn').removeClass('active');
                    } else {
                        $('#right_min_btn').addClass('active');
                    }
                } else if (type == 3) {
                    if (now.Format("yyyy") == val.replace(/\//g, "")) {
                        $('#right_min_btn').removeClass('active');
                    } else {
                        $('#right_min_btn').addClass('active');
                    }
                }
                this.loadPsAllDevice();
            } else {
                $('#right_min_btn').removeClass('active');
            }
        },

        //点击日期 箭头
        arrowChangeDate: function () {
            var temdate = "";
            var val = 0;
            if (event.target == document.getElementById("left_min_btn")) {//判断事件对象，左键头时间向前
                val = -1;
            } else if (event.target == document.getElementById("right_min_btn")) {
                val = 1;
            }
            var date = $("#dateInput").val();
            date = date.substring(0, 10);
            if (this.dialog_psunit.dateType == "1") {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addDays(val);//加、减日 操作
                temdate = d1.Format("yyyy/MM/dd");
                this.isIncreaseDateAvailable(1, temdate, false);
            } else if (this.dialog_psunit.dateType == "2") {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addMonths(val);
                temdate = d1.Format("yyyy/MM");
                this.isIncreaseDateAvailable(2, temdate, false);
            } else if (this.dialog_psunit.dateType == "3") {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addYears(val);
                temdate = d1.Format("yyyy");
                this.isIncreaseDateAvailable(3, temdate, false);
            }
        },

        getInputDate: function () {
            var date = $("#dateInput").val();
            date = date.replace(/\//g, "");
            return date;
        },

        setDateInputFormat: function () {
            var _this = this;
            if (this.dialog_psunit.dateType == "1" || !this.dialog_psunit.dateType) {
                $("#dateInput").unbind();
                $("#dateInput").click(function () {
                    WdatePicker({
                        dateFmt: 'yyyy/MM/dd',
                        maxDate: '%y/%M/%d',
                        isShowClear: false,
                        readOnly: true,
                        onpicking: function (dp) {
                            _this.dateChanged(dp.cal.getDateStr(), dp.cal.getNewDateStr());
                        }
                    });
                });
            } else if (this.dialog_psunit.dateType == "2") {
                $("#dateInput").unbind();
                $("#dateInput").click(function () {
                    WdatePicker({
                        dateFmt: 'yyyy/MM',
                        maxDate: '%y/%M',
                        isShowClear: false,
                        readOnly: true,
                        onpicking: function (dp) {
                            _this.dateChanged(dp.cal.getDateStr(), dp.cal.getNewDateStr());
                        }
                    });
                });
            } else {
                $("#dateInput").unbind();
                $("#dateInput").click(function () {
                    WdatePicker({
                        dateFmt: 'yyyy',
                        maxDate: '%y',
                        isShowClear: false,
                        readOnly: true,
                        onpicking: function (dp) {
                            _this.dateChanged(dp.cal.getDateStr(), dp.cal.getNewDateStr());
                        }
                    });
                });
            }
        },

        dateChanged: function (dStrOld, dStrNew) {
            $("#dateInput").val(dStrNew);
            this.isIncreaseDateAvailable(this.dialog_psunit.dateType, dStrNew, false);
            this.loadPsAllDevice();
        },

        //判断分页箭头可用
        isPageArrowAvilable: function () {
            if (this.curYearGen.pageCount > this.curYearGen.currentPage) {
                $("#right_max_btn").unbind().bind('click', this.arrowChangePage);
                $("#right_max_btn").css("opacity", 1);
            } else {
                $("#right_max_btn").unbind('click', this.arrowChangePage);
                $("#right_max_btn").css("opacity", 0.3);
            }
            if (1 < this.curYearGen.currentPage) {
                $("#left_max_btn").unbind().bind('click', this.arrowChangePage);
                $("#left_max_btn").css("opacity", 1);
            } else {
                $("#left_max_btn").unbind('click', this.arrowChangePage);
                $("#left_max_btn").css("opacity", 0.3);
            }

        },

        toUnit: function () {
            $(".showInverter").hide();
            this.curYearGen.psTemType = "2";
            this.dialog_psunit.deviceType = "17";
            this.curYearGen.uuid_index = "";
            this.loadPsAllDevice();
        },

        showInveter: function (uuid) {
            $(".showInverter").show();
            var eventObj = event.target;
            var li = $(eventObj).closest('li');
            var h5 = $(li).find('H5');
            var name = $(h5).text();
            $("#unitName").text(name);
            this.curYearGen.psTemType = "1";
            this.dialog_psunit.deviceType = "1";
            this.curYearGen.uuid_index = uuid;
            this.loadPsAllDevice();
        },
    },
    mounted: function () {
        this.initTime();
        this.setDateInputFormat();
    }

})