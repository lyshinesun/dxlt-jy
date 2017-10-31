//2016-11-12 ChuD; 等效小时、发电量排名弹出框
var dialog = {
    genOrEqHr: 2, //1:等效小时; 2.发电量; 3:发电趋势; 4.发电量报表
    dateType: '1', //等效小时、发电量 排名  1:日  2:月  3:年
    curtOrgId_refresh: "", //当前组织id，用于 定时刷新
    dxxChart: "",
    fdlChart: "",
    trendsChart: "",
    pageSize: 10,//每页显示条目数
    currentPage: 1, //当前页
    rowCount: 0,//总条目数
    pageCount: 0,//总页数

    dateLine: 0,  //单电站发电趋势点击后的数据根据时间区分
    dateFlag: 0,  // 0 代表所有电站日期切换  1 单电站日期切换
    scrnvs: 3,
    psName: "",
    psId: "",
    psIdArr: []
};

function getFmTime(time) {
    var resTime = "";
    //var temVal = dealTimeNum(time);
    var temVal = time;
    var date = $("#dateInput").val();
    if (dialog.dateType == 1) {
        resTime = date + " " + temVal + ":00";
    } else {
        resTime = date + "/" + temVal;
    }
    return resTime;
}

new Vue({
    el: '#powerTrend',
    data: {
        myDate: new Date(),
        showIncreaseDate: false
    },
    methods: {

        initTime: function () {
            var daybegin = new Date();
            var year = daybegin.getFullYear();
            var month = daybegin.getMonth() + 1;
            var date = daybegin.getDate();
            var month1 = month >= 10 ? month : ("0" + month);
            var date1 = date >= 10 ? date : ("0" + date);
            var thisDate = year + "/" + month1 + "/" + date1;
            if (dialog.dateType == "2") {
                thisDate = year + "/" + month1;
            } else if (dialog.dateType == "3") {
                thisDate = year;
            }
            $("#dateInput").val(thisDate);
        },

        power_hourTab: function (e) {
            var tabType = $(e.target).attr('data-powerType');
            $('.showm_top_left ul li').removeClass('on');
            $(".showm_bottom .loadingDiv").show();
            if (tabType == 'power') {
                $(".time_menunav").show();
                $(".report_wrap").hide();
                this.setDateInputFormat();
                $(".time_menunav >ul li").removeClass('on');
                if (dialog.dateType == 1) {
                    $(".time_menunav").show().find('li').eq(0).addClass('on');
                } else if (dialog.dateType == 2) {
                    $(".time_menunav").show().find('li').eq(1).addClass('on');
                }
                if (dialog.dateType == 3) {
                    $(".time_menunav").show().find('li').eq(2).addClass('on');
                }
                //点击发电量btn
                $('.showm_top_left ul li').eq(0).addClass('on');
                $("#dxxs_li").show();  //等效小时btn显示
                $(".max_btn").show();  //左右切换大btn显示
                $("#fdlAllChart").show();  //发电量chart
                $("#dxxsAll").hide();
                $("#genTrends").hide();
                $("#psName").hide();
                dialog.dateFlag = 0; //多电站日期切换模式
                this.loadDXXOrFDL('1');
            } else if (tabType == 'hour') {
                $(".time_menunav").show();
                $(".report_wrap").hide();
                $(".time_menunav >ul li").removeClass('on');
                if (dialog.dateType == 1) {
                    $(".time_menunav").show().find('li').eq(0).addClass('on');
                } else if (dialog.dateType == 2) {
                    $(".time_menunav").show().find('li').eq(1).addClass('on');
                }
                if (dialog.dateType == 3) {
                    $(".time_menunav").show().find('li').eq(2).addClass('on');
                }
                //点击等效小时btn
                $('.showm_top_left ul li').eq(1).addClass('on');
                $("#dxxsAll").show();
                $("#fdlAllChart").hide();
                this.loadDXXOrFDL();
            } else if (tabType == 'report') {
                //点击报表btn
                var _this = this;
                $(".time_menunav").hide();
                $('.showm_top_left ul li').eq(2).addClass('on');
                $("#dxxsAll").hide();
                $("#fdlAllChart").hide();
                dialog.dateType = '1';
                this.initTime();
                dialog.genOrEqHr = 4;
                this.getReport($('#dateInput').val());
                $("#dateInput").unbind();
                $("#dateInput").click(function () {
                    WdatePicker({
                        dateFmt: 'yyyy/MM/dd',
                        maxDate: '%y/%M/%d',
                        isShowClear: false,
                        readOnly: true,
                        onpicking: function (dp) {
                            _this.getReport(dp.cal.getNewDateStr());
                        }
                    });
                });

            }

        },

        //获取报表数据
        getReport: function (key) {
            var dateNum = key.replace(/\//g, "");
            var startDateStr = dateNum.substring(0, 6) + '01000000';
            var year = dateNum.substring(0, 4);
            var month = dateNum.substring(4, 6);
            var day = dateNum.substring(6);
            if (month < 10) {
                month = month.substring(1);
            }
            if (day < 10) {
                day = day.substring(1);
            }
            var date = new Date();
            date.setFullYear(year, month - 1, day);
            var Month = date.getMonth() + 1;
            var hour = date.getHours();
            var minute = date.getMinutes();
            var second = date.getSeconds();
            var endDateStr = date.getFullYear() + '' + dealDate(Month) + '' + dealDate(day) + dealDate(hour) + dealDate(minute) + dealDate(second);
            $(".showm_bottom .loadingDiv").show();
            var Parameters = {
                "parameters": {
                    "stationtype": "allstation",
                    "timetype": "3",
                    "sorttype": "1",
                    "sort": "1",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "1000",
                    "stationid": ""
                },
                "foreEndType": 2,
                "code": "20000005"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                console.log(res);
                $(".showm_bottom .loadingDiv").hide();
                if (res.success) {
                    var reportArr = res.data.fd_datas;
                    if($(".showm_table_rep").length > 0){
                        $(".showm_table_rep").remove();
                    }
                    if(reportArr.length){
                        if($('.report_wrap').find('h3').length){
                            $('.report_wrap').find('h3').remove();
                        }
                        var reportStr = $('#powerReport_tpl').html();
                        trHtml = ejs.render(reportStr, {reportArr: reportArr});

                        var oWrap=$('<div class="showm_table_rep">'+
                            '<table>'+
                            '<tbody id="tbody_report"></tbody>'+
                            '</table>'+
                            '</div>');
                        oWrap.appendTo($('.report_wrap'));
                        $("#tbody_report").html(trHtml);
                        $(".report_wrap").show();
                        $(".showm_table_rep").mCustomScrollbar();
                    }else{
                        if(! $('.report_wrap').find('h3').length){
                            var oWrap=$('<h3 style="text-align: center;line-height: 40px;color:#fff">查询无数据</h3>');
                            oWrap.appendTo($('.report_wrap'));
                            $(".report_wrap").show();
                        }
                    }
                }
            });
        },


        //根据时间类型type 刷新等效小时数据 1:日  2:月  3:年
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
            dialog.dateType = type;
            this.initTime();
            this.setDateInputFormat();  //时间input绑定WdatePicker
            $('#right_min_btn').removeClass('active');

            if (dialog.genOrEqHr == 1) {  //等效小时
                this.loadDXXSAll();
            } else if (dialog.genOrEqHr == 2) { //发电量排名
                this.loadFDLAll();

            } else if (dialog.genOrEqHr == 3) { //发电趋势
                this.loadGenTrendsData();
            }
        },

        loadDXXOrFDL: function (val) {
            dialog.currentPage = 1;
            if (val == 1) {
                this.loadFDLAll();
            } else if (val == 3) {
                this.loadGenTrendsData();
            } else {
                this.loadDXXSAll();
            }
        },

        //加载所有县区的等效小时排名;
        loadDXXSAll: function () {
            dialog.genOrEqHr = 1;
            dialog.dxxChart = echarts.init(document.getElementById('dxxsAll'));
            var _this = this,
                dateType = dialog.dateType,
                dateStr = '',
                startDateStr = '',
                dates = new Date(),
                endDate = dates.getFullYear() + '-' + (dates.getMonth() + 1) + '-' + dates.getDate() + 'T' + dates.getHours() + ':' + dates.getMinutes() + ':' + dates.getSeconds(),
                endDateStr = vlm.Utils.format_date(endDate, 'YmdHis');
            switch (dateType) {
                case '1':
                    dateStr = '2';
                    var dateNum = this.getInputDate($('#dateInput').val());
                    startDateStr = this.getInputDate(dateNum) + '000000';
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
                    dateStr = '6';
                    var dateNum = this.getInputDate($('#dateInput').val());
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
                    dateStr = '7';
                    startDateStr = $('#dateInput').val() + '0101000000';
                    endDateStr = (Number($('#dateInput').val()) + 1) + '0101000000';
                    break;
                default :
                    ;
            }
            var Parameters = {
                "parameters": {
                    "stationtype": "allstation",
                    "timetype": dateStr,
                    "sorttype": "1",
                    "sort": "1",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "300",
                    "stationid": ""
                },
                "foreEndType": 2,
                "code": "20000005"
            };
            //console.log(Parameters);
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                //console.log(res);
                if (res.success) {
                    var result_data = res.data,
                        dxxsData = [],
                        areaData = [],
                        unit = '小时';
                    var resultArray = result_data.fd_datas;
                    if (resultArray.length) {
                        for (var i = 0; i < resultArray.length; i++) {
                            resultArray[i].equivalenthour = parseFloat(resultArray[i].equivalenthour);
                        }
                        resultArray = vlm.Utils.sortArr(resultArray, 'equivalenthour');

                        for (var i = 0; i < resultArray.length; i++) {
                            dxxsData.push(resultArray[i].equivalenthour);
                            areaData.push(resultArray[i].fd_station_name);
                        }
                        _this.showDXXSAll(dxxsData, areaData, unit);
                    } else {
                        $('.loadingDiv').hide();
                        $('#dxxsAll').hide();
                    }
                }
            });
        },


        //等效小时弹出chart
        showDXXSAll: function (valueAxis, areaData, unit) {
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        //"<p align='left' >排名：" + (data[0].dataIndex + 1) + "</p>" +
                        return "<p align='left'>" + LANG["powerStation"] + "：" + data[0].name + "</p>" +
                            "<p align='left'>" + data[0].seriesName + "：" + data[0].value + unit;
                    }
                },
                legend: {
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: 'right',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '10',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["1_1_equalHour"]]
                },
                // 网格
                grid: {
                    //x: 30,
                    //y: 35,
                    //x2: 0,
                    //y2: 0,
                    //width: 320,
                    //height: 160,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc'
                },

                calculable: true,
                xAxis: [
                    {
                        type: 'category',
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            interval: 0,// 是否显示全部标签，0显示
                            rotate: 25,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        splitLine: {
                            show: false
                        },

                        data: areaData
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: unit,
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        nameTextStyle: {
                            fontSize: 15,
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisTick: axisTickObj
                    }
                ],
                series: [
                    {
                        name: LANG["1_1_equalHour"],
                        type: 'bar',
                        barMaxWidth: 50,
                        stack: 'sum',
                        itemStyle: {
                            normal: {
                                color: '#3EB5FF'
                            }
                        },
                        data: valueAxis
                    }
                ]
            };
            dialog.dxxChart.setOption(option);
            $(".showm_bottom .loadingDiv").hide();
            $("#dxxsAll").show();
        },
        //加载发电量排名
        loadFDLAll: function () {
            dialog.genOrEqHr = 2;
            dialog.fdlChart = echarts.init(document.getElementById('fdlAllChart'));
            var _this = this,
                dateType = dialog.dateType,
                dateStr = '',
                startDateStr = '',
                dates = new Date(),
                endDate = dates.getFullYear() + '-' + (dates.getMonth() + 1) + '-' + dates.getDate() + 'T' + dates.getHours() + ':' + dates.getMinutes() + ':' + dates.getSeconds(),
                endDateStr = vlm.Utils.format_date(endDate, 'YmdHis');

            switch (dateType) {
                case '1':   //所有电站按天
                    dateStr = '2';
                    var dateNum = this.getInputDate($('#dateInput').val());
                    startDateStr = this.getInputDate(dateNum) + '000000';
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
                case '2': //所有电站按月
                    dateStr = '6';
                    var dateNum = this.getInputDate($('#dateInput').val());
                    var date = new Date();
                    var year = dateNum.substring(0, 4);
                    var month = dateNum.substring(4);
                    if (month < 10) {
                        month = month.substring(1);
                    }
                    ;
                    date.setFullYear(year, month, 0);
                    var day = date.getDate();
                    startDateStr = dateNum + '01000000';
                    endDateStr = dateNum.substring(0, 6) + day + '000000';
                    break;
                case '3': //所有电站按年
                    dateStr = '7';
                    startDateStr = $('#dateInput').val() + '0101000000';
                    endDateStr = (Number($('#dateInput').val()) + 1) + '0101000000';
                    break;
                default :
                    ;
            }
            var Parameters = {
                "parameters": {
                    "stationtype": "allstation",
                    "timetype": dateStr,
                    "sorttype": "1",
                    "sort": "1",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "100",
                    "stationid": ""
                },
                "foreEndType": 2,
                "code": "20000005"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                if (res.success) {
                    var result_data = res.data,
                        generationData = [],
                        areaData = [],
                        unit = result_data.fd_unit;
                    var resultArray = result_data.fd_datas;
                    if (resultArray.length) {
                        resultArray = vlm.Utils.sortArr(resultArray, 'fd_power_day');  //sort
                        for (var i = 0; i < resultArray.length; i++) {
                            generationData.push(resultArray[i].fd_power_day);
                            areaData.push(resultArray[i].fd_station_name);
                            dialog.psIdArr.push(resultArray[i].fd_station_id);
                        }
                        _this.showFDLAll(generationData, areaData, unit);
                    } else {
                        $('.loadingDiv').hide();
                    }
                }
            });
        },

        //发电量弹出chart
        showFDLAll: function (valueAxis, areaData, unit) {
            var _this = this;
            $("#fdlAllChart div").show();
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        //return data[0].name + "<br>" + data[0].seriesName + "：" + data[0].value + unit;
                        return "<p align='left'>" + LANG["powerStation"] + "：" + data[0].name + "</p>" +
                            "<p align='left'>" + data[0].seriesName + "：" + data[0].value + unit;
                    }
                },
                legend: {
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: 'right',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '10',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["yy1.PowerGeneration"]]
                },
                // 网格
                grid: {
                    //x: 30,
                    //y: 35,
                    //x2: 0,
                    //y2: 0,
                    //width: 320,
                    //height: 160,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc'
                },

                calculable: false,
                xAxis: [
                    {
                        type: 'category',
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            interval: 0,// 是否显示全部标签，0显示
                            rotate: 25,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        splitLine: {
                            show: false
                        },

                        data: areaData
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: unit,
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        nameTextStyle: {
                            fontSize: 15,
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisTick: axisTickObj
                    }
                ],
                series: [
                    {
                        name: LANG["yy1.PowerGeneration"],
                        type: 'bar',
                        barMaxWidth: 50,
                        stack: 'sum',
                        itemStyle: {
                            normal: {
                                color: '#3EB5FF'
                            }
                        },
                        data: valueAxis
                    }
                ]
            };

            $(".showm_bottom .loadingDiv").hide();
            dialog.fdlChart.setOption(option);

            dialog.fdlChart.on('click', function (params) {
                var index = params.dataIndex;
                event.stopPropagation();
                if (dialog.scrnvs == 3) {
                    dialog.psName = params.name;
                    dialog.psId = dialog.psIdArr[index];
                    dialog.dateFlag = 1;
                    _this.showPsGenTrends();
                }
            });
        },

        //判断能否增长日期 val(eg:2016-01-01)
        isIncreaseDateAvailable: function (type, val) {
            var now = new Date();
            if (type == 1) {//日
                if (now.Format("yyyyMMdd") >= val.substring(0).replace(/\//g, "")) {
                    this.showIncreaseDate = true;
                } else {
                    this.showIncreaseDate = false;
                }
            } else if (type == 2) {//月
                if (now.Format("yyyyMM") >= val.substring(0, 7).replace(/\//g, "")) {
                    this.showIncreaseDate = true;
                } else {
                    this.showIncreaseDate = false;
                }
            } else if (type == 3) {//年
                if (now.Format("yyyy") >= val.substring(0, 4).replace(/\//g, "")) {
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

                if (dialog.genOrEqHr == 1) {
                    this.loadDXXOrFDL();
                } else if (dialog.genOrEqHr == 2) {
                    this.loadDXXOrFDL('1');
                } else if(dialog.genOrEqHr == 4){
                    this.getReport($("#dateInput").val());
                }else {
                    this.loadDXXOrFDL('3');
                }

            } else {
                $('#right_min_btn').removeClass('active');
            }
        },

        //点击日期 箭头
        arrowChangeDate: function (e) {
            var temdate = "", val = 0;
            if ($(e.target).attr('id') == 'left_min_btn') {
                val = -1;
            } else if ($(e.target).attr('id') == 'right_min_btn') {
                val = 1;
            }
            var date = $("#dateInput").val();
            date = date.substring(0, 10);
            if (dialog.dateType == 1) {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addDays(val);//加、减日 操作
                temdate = d1.Format("yyyy/MM/dd");
                this.isIncreaseDateAvailable(1, temdate);
            } else if (dialog.dateType == 2) {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addMonths(val);
                temdate = d1.Format("yyyy/MM");
                this.isIncreaseDateAvailable(2, temdate);
            } else if (dialog.dateType == 3) {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addYears(val);
                temdate = d1.Format("yyyy");
                this.isIncreaseDateAvailable(3, temdate);
            }

        },

        getInputDate: function () {
            var date = $("#dateInput").val();
            date = date.replace(/\//g, "");
            return date;
        },

        setDateInputFormat: function () {
            var _this = this;
            if (dialog.dateType == 1 || !dialog.dateType) {
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
            } else if (dialog.dateType == 2) {
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
            this.isIncreaseDateAvailable(dialog.dateType, dStrNew, false);
            if (dialog.genOrEqHr == 2) {
                this.loadFDLAll();
            } else if (dialog.genOrEqHr == 3) {
                this.loadGenTrendsData();
            } else {
                this.loadDXXSAll();
            }
        },

        //箭头分页
        arrowChangePage: function () {
            if (event.target == document.getElementById("left_max_btn") && dialog.currentPage > 1) {
                dialog.currentPage--;
            } else if (event.target == document.getElementById("right_max_btn")) {
                dialog.currentPage++;
            }
            if (dialog.genOrEqHr == 2) {
                this.loadFDLAll();
            } else {
                this.loadDXXSAll();
            }
            this.isPageArrowAvilable();
        },

        //判断分页箭头可用
        isPageArrowAvilable: function () {
            if (dialog.pageCount > dialog.currentPage) {
                $("#right_max_btn").unbind().bind('click', arrowChangePage);
                $("#right_max_btn").css("opacity", 1);
                $("#right_max_btn").css("cursor", 'pointer');
            } else {
                $("#right_max_btn").unbind('click', arrowChangePage);
                $("#right_max_btn").css("opacity", 0.3);
                $("#right_max_btn").css("cursor", 'default');
            }
            if (1 < dialog.currentPage) {
                $("#left_max_btn").unbind().bind('click', arrowChangePage);
                $("#left_max_btn").css("opacity", 1);
                $("#left_max_btn").css("cursor", 'pointer');
            } else {
                $("#left_max_btn").unbind('click', arrowChangePage);
                $("#left_max_btn").css("opacity", 0.3);
                $("#left_max_btn").css("cursor", 'default');
            }
        },

        showPsGenTrends: function () {
            $("#fdlAllChart").hide();
            $("#genTrends").show();
            $("#dxxs_li").hide();
            $(".max_btn").hide();
            $("#psName").show();
            $("#psNameA").text(dialog.psName + "-" + LANG["generationTrend"]);
            dialog.genOrEqHr = 3;
            this.loadGenTrendsData();
        },

        loadGenTrendsData: function () {
            var _this = this,
                dateType = dialog.dateType,
                startDateStr = '',
                endDateStr = '';
            dialog.trendsChart = echarts.init(document.getElementById('genTrends'));
            $(".showm_bottom .loadingDiv").show();

            switch (dateType) {
                case '1':
                    dateStr = '1';
                    var dateNum = this.getInputDate($('#dateInput').val());
                    startDateStr = this.getInputDate(dateNum) + '000000';
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
                    dialog.dateLine = 24;
                    break;
                case '2':
                    dateStr = '2';
                    var dateNum = this.getInputDate($('#dateInput').val());
                    var date = new Date();
                    var year = dateNum.substring(0, 4);
                    var month = dateNum.substring(4);
                    if (month < 10) {
                        month = month.substring(1);
                    }
                    ;
                    date.setFullYear(year, month, 0);
                    var day = date.getDate();
                    startDateStr = dateNum + '01000000';
                    endDateStr = dateNum.substring(0, 6) + day + '000000';
                    var dateObj = new Date();
                    dateObj.setMonth(dateObj.getMonth() + 1, 0)
                    dialog.dateLine = dateObj.getDate();
                    break;
                case '3':
                    dateStr = '3';
                    startDateStr = $('#dateInput').val() + '0101000000';
                    endDateStr = (Number($('#dateInput').val()) + 1) + '0101000000';
                    dialog.dateLine = 12;
                    break;
                default :
                    ;
            }
            var Parameters = {
                "parameters": {
                    "stationtype": "",
                    "timetype": dateStr,
                    "sorttype": "1",
                    "sort": "2",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "300",
                    "stationid": dialog.psId
                },
                "foreEndType": 2,
                "code": "30000003"
            };

            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                //console.log(res);
                if (res.success) {
                    var result = res.data,
                        resultData = result.fd_datas,
                        unit = result.fd_unit,
                        actualData = [],
                        dateDate = [],
                        hourNum = '',
                        hourMaxNum = '';
                    if (dateType == 1) {
                        hourNum = resultData[0].fd_datetime < 10 ? resultData[0].fd_datetime.substring(1) : resultData[0].fd_datetime;
                        hourMaxNum = resultData[resultData.length - 1].fd_datetime < 10 ? resultData[resultData.length - 1].fd_datetime.substring(1) : resultData[resultData.length - 1].fd_datetime;
                    } else if (dateType == 2) {
                        hourNum = resultData[0].fd_datetime;
                        hourMaxNum = resultData[resultData.length - 1].fd_datetime;
                    } else if (dateType == 3) {
                        hourNum = resultData[0].fd_datetime.substring(6);
                        hourMaxNum = resultData[resultData.length - 1].fd_datetime.substring(6);
                    }
                    for (var i = 1; i <= dialog.dateLine; i++) {
                        if (i < hourNum || i > hourMaxNum) {
                            actualData.push(0);
                        } else {
                            actualData.push(resultData[i - hourNum].fd_power_day);
                        }
                        dateDate.push(i);
                    }
                    _this.drawTrendsChart(actualData, unit, dateDate);
                }
            })

        },

        drawTrendsChart: function (actualData, actualData_unit, dateDate) {
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        var str = "<p align='left'>" + LANG["TIME"] + "：" + getFmTime(data[0].name) + "</p>";
                        str += "<p align='left'>" + LANG["yy1.PowerGeneration"] + "：" + dealEchartToolTip(data[0].value) + actualData_unit;
                        return str;
                    }
                },
                legend: {
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: 'right',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '10',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["yy1.PowerGeneration"]]
                },
                // 网格
                grid: {
                    //x: 30,
                    //y: 35,
                    //x2: 0,
                    //y2: 0,
                    //width: 320,
                    //height: 160,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc'
                },
                xAxis: [
                    {
                        type: 'category',
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            interval: 0,// 是否显示全部标签，0显示
                            rotate: 0,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        splitLine: {
                            show: false
                        },

                        data: dateDate
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: actualData_unit,
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        nameTextStyle: {
                            fontSize: 15,
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisTick: axisTickObj
                    }
                ],
                series: [
                    {
                        name: LANG["yy1.PowerGeneration"],
                        type: 'bar',
                        barMaxWidth: 50,
                        stack: 'sum',
                        itemStyle: {
                            normal: {
                                color: '#3EB5FF'
                            }
                        },
                        data: actualData
                    }
                ]
            };

            $(".showm_bottom .loadingDiv").hide();
            dialog.trendsChart.setOption(option);
        },

        closeWindow: function () {
            $(".Mc4_bg_highLt", parent.document).removeClass("Mc4_bg_highLt");
            window.parent.closeEqualHourFm();
        }
    },
    mounted: function () {
        this.showEqHourData(1);
    }
});






