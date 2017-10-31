//2016-11-12 ChuD; 等效小时、发电量排名弹出框
var dialog = {
    dateType: 2, //pr  1:日  2:月  3:年
    pageSize: 10,//每页显示条目数
    currentPage: 1, //当前页
    rowCount: 0,//总条目数
    pageCount: 0,//总页数
    showIncreaseDate: false,
    isCurrentDate: true
};

new Vue({
    el: '#getPr',
    data: {
        currentDate: ''// 请求所需的日期：2017-02或2017
    },
    methods: {
        initTime: function () {
            var daybegin = new Date();
            var year = daybegin.getFullYear();
            var month = daybegin.getMonth() + 1;
            var date = daybegin.getDate();
            var hour = daybegin.getHours();
            var min = daybegin.getMinutes();
            var month1 = month >= 10 ? month : ("0" + month);
            var date1 = date >= 10 ? date : ("0" + date);
            var thisDate = year + "/" + month1; //+"/"+date1;
            if (dialog.dateType == "2") {
                thisDate = year + "/" + month1;
                this.currentDate = year + "-" + month1
            } else if (dialog.dateType == "3") {
                thisDate = year;
                this.currentDate = year + ''
            }
            $("#dateInput").val(thisDate);
        },

        showEqHourData: function (e) {
            var type = '';
            /*点击月、年修改点击按钮的样式*/
            $('.time_menunav_my ul li').removeClass("on");
            if ($(e.target).attr('dateTabType') == 2 || $(e.target).attr('dateTabType') == undefined) {
                $('.time_menunav_my ul li').eq(0).addClass("on");
                type = '2';
            } else {
                $('.time_menunav_my ul li').eq(1).addClass("on");
                type = $(e.target).attr('dateTabType');

            }
            dialog.dateType = type;
            this.initTime();
            this.setDateInputFormat();  //时间input绑定WdatePicker
            this.loadPrChart();
            $('#right_min_btn').removeClass('active');
        },

        loadPrChart: function () {
            var dateType = dialog.dateType;
            $(".showm_bottom .loadingDiv").show();
            dialog.genOrEqHr = 1;
            var _this = this,
                dates = new Date(),
                endDate = dates.getFullYear() + '-' + (dates.getMonth() + 1) + '-' + dates.getDate() + 'T' + dates.getHours() + ':' + dates.getMinutes() + ':' + dates.getSeconds(),
                endDateStr = vlm.Utils.format_date(endDate, 'YmdHis');

            switch (dateType) {
                case '2':
                    var dateNum = this.getInputDate($('#dateInput').val());
                    var date = new Date();
                    var year = dateNum.substring(0, 4);
                    var month = dateNum.substring(4);
                    _this.currentDate = year + "-" + month;
                    break;
                case '3':
                    startDateStr = $('#dateInput').val();
                    _this.currentDate = startDateStr;
                    break;
                default :
                    ;
            }

            /*java接口测试 */
            $.ajax({
                url:vlm.serverAddr+'stationInfo/getPerSort',
                type:'get',
                dataType:'json',
                data:{
                    'date': _this.currentDate,
                    'type': dateType
                },
                success:function(res){
                    if (res.code == 200) {
                        var dxxsData = [];//等效小时
                        var psPrData = [];//PR
                        var areaData = [];//地区
                        var unit = "小时";
                        var resultArray = res.list;
                        if(resultArray.length){
                            for (var i = 0; i < resultArray.length; i++) {
                                var obj = resultArray[i];
                                dxxsData.push(obj.avgHour);
                                psPrData.push(obj.pr);
                                areaData.push(obj.psName);
                            }
                            _this.showDXXSTable(dxxsData, psPrData, areaData, unit);
                            _this.showPrChart(dealEchartBarArr(dxxsData), dealEchartBarArr(psPrData), areaData, unit);
                        }else{
                            $(".showm_bottom .loadingDiv").hide();
                            $("#dxxsAll").css('visibility','hidden');
                        }
                    } else {
                        alert(res.message);
                    }
                },
                error:function(){},
            });
        },

        //等效小时弹出chart
        showPrChart: function (valueAxis, psPrData, areaData, unit) {
            $("#dxxsAll").css('visibility','visible');
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        var str = "<p align='left'>" + LANG["powerStation"] + "：" + data[0].name + "</p>";
                        for (var i = 0; i < data.length; i++) {
                            if (LANG["1_1_equalHour"] == data[i].seriesName) {
                                str += "<p align='left'>" + data[i].seriesName + "：" + dealEchartToolTip(data[i].value) + "h";
                            } else {
                                str += "<p align='left'>" + data[i].seriesName + "：" + dealEchartToolTip(data[i].value) + "%";
                            }
                        }
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
                    data: [LANG["1_1_equalHour"], 'PR']
                },
                // 网格
                grid: {
                    //x: 30,
                    y: 65,
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
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
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
                        name: (LANG["1_1_equalHour"] + "（" + LANG["unit"] + " ：h）"),
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        axisTick: axisTickObj

                    },
                    {
                        type: 'value',
                        name: "PR（" + LANG["unit"] + " ：%）",
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        min: 0,
                        max: 100,
                        axisTick: axisTickObj
                    }
                ],
                series: [
                    {
                        name: LANG["1_1_equalHour"],
                        type: 'bar',
                        yAxisIndex: 0,
                        barMaxWidth: 50,
                        itemStyle: {
                            normal: {
                                color: '#3EB5FF'
                            }
                        },
                        data: valueAxis
                    },
                    {
                        name: 'PR',
                        type: 'line',
                        yAxisIndex: 1,
                        itemStyle: {
                            normal: {
                                color: '#fdd600'
                            }
                        },
                        data: psPrData
                    }
                ]
            };
            $('.loadingDiv').hide();
            var ptChart = echarts.init(document.getElementById('dxxsAll'));
            ptChart.setOption(option);
            $(".showm_bottom .loadingDiv").hide();
            $("#dxxsAll div").show();
        },

        //判断能否增长日期 val(eg:2016-01-01)
        isIncreaseDateAvailable: function (type, val, isInner) {
            console.log(val)
            var _this = this
            console.log(type, val, isInner)
            var now = new Date();
            if (type == 2) {//月
                if (now.Format("yyyyMM") > val.substring(0, 7).replace(/\//g, "")) {
                    _this.showIncreaseDate = true;
                    _this.isCurrentDate = false

                } else if (now.Format("yyyyMM") == val.substring(0, 7).replace(/\//g, "")){
                    _this.showIncreaseDate = false;
                    _this.isCurrentDate = true
                } else {
                    _this.showIncreaseDate = false;
                    _this.isCurrentDate = false
                }
            } else if (type == 3) {//年
                if (now.Format("yyyy") >= val.substring(0, 4).replace(/\//g, "")) {
                    _this.showIncreaseDate = true;
                    _this.isCurrentDate = false
                } else if (now.Format("yyyy") == val.substring(0, 4).replace(/\//g, "")) {
                    _this.showIncreaseDate = false;
                    _this.isCurrentDate = true
                } else {
                    _this.showIncreaseDate = false;
                    _this.isCurrentDate = false
                }
            }

            if (_this.showIncreaseDate) {  //可以增加
                $('#right_min_btn').addClass('active');
                $("#dateInput").val(val);
                this.loadPrChart();
            } else {
                if (_this.isCurrentDate) {
                    $("#dateInput").val(val);
                    this.loadPrChart();
                }
                $('#right_min_btn').removeClass('active');
            }
        },
        //点击日期 箭头
        arrowChangeDate: function () {
            var _this = this
            var temdate = "";
            var val = 0;
            if (event.target == document.getElementById("left_min_btn")) {//判断事件对象，左键头时间向前
                val = -1;
            } else if (event.target == document.getElementById("right_min_btn")) {
                val = 1;
            }
            var date = $("#dateInput").val();
            if (dialog.dateType == "2") {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addMonths(val);
                temdate = d1.Format("yyyy/MM");
                this.isIncreaseDateAvailable(2, temdate, false);
            } else if (dialog.dateType == "3") {
                var d1 = new Date(date.replace(/\-/g, "\/"));
                d1.addYears(val);
                temdate = d1.Format("yyyy");
                this.isIncreaseDateAvailable(3, temdate, false);
            }
            _this.currentDate = temdate.replace(/\//g, "-")
        },

        //箭头分页
        arrowChangePage: function () {
            if (event.target == document.getElementById("left_max_btn") && dialog.currentPage > 1) {
                dialog.currentPage--;
            } else if (event.target == document.getElementById("right_max_btn")) {
                dialog.currentPage++;
            }
            this.loadPrChart();
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

        getInputDate: function () {
            var date = $("#dateInput").val();
            date = date.replace(/\//g, "");
            return date;
        },

        setDateInputFormat: function () {
            var _this = this;
            if (dialog.dateType == "1" || !dialog.dateType) {
                $("#dateInput").unbind();
                $("#dateInput").click(function () {
                    WdatePicker({
                        dateFmt: 'yyyy/MM/dd',
                        maxDate: '%y/%M/%d',
                        isShowClear: false,
                        readOnly: true,
                        onpicking: function (dp) {
                            let temdate = dp.cal.getNewDateStr()
                            _this.currentDate = temdate.replace(/\//g, "-")
                            _this.dateChanged(dp.cal.getDateStr(), dp.cal.getNewDateStr());
                        }
                    });
                });
            } else if (dialog.dateType == "2") {
                $("#dateInput").unbind();
                $("#dateInput").click(function () {
                    WdatePicker({
                        dateFmt: 'yyyy/MM',
                        maxDate: '%y/%M',
                        isShowClear: false,
                        readOnly: true,
                        onpicking: function (dp) {
                            let temdate = dp.cal.getNewDateStr()
                            _this.currentDate = temdate.replace(/\//g, "-")
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
                            let temdate = dp.cal.getNewDateStr()
                            _this.currentDate = temdate.replace(/\//g, "-")
                            _this.dateChanged(dp.cal.getDateStr(), dp.cal.getNewDateStr());
                        }
                    });
                });
            }
        },

        dateChanged: function (dStrOld, dStrNew) {
            if (true) {
                this.isIncreaseDateAvailable(dialog.dateType, dStrNew, false);
                this.loadPrChart();
            }
        },

        showDXXSTable: function (dxxsData, psPrData, areaData, unit) {
            var htmlStr = "<tr>";
            for (var i = 0; i < dxxsData.length; i++) {
                htmlStr += "<td>" + areaData[i] + "</td>";
                htmlStr += "<td>" + dxxsData[i] + unit + "</td>";
                htmlStr += "<td>" + psPrData[i] + "%" + "</td>";
                htmlStr += "</tr>";
            }
            $("#tbody_id").html(htmlStr);
            $(".showm_table").mCustomScrollbar({});
        },

        toggleShow: function () {
            $(".plan_dxxsAll").toggle();
            $(".plan_dxxsAll_table").toggle();
            $(".cgDataview").toggle();
        },

        showSortData: function (val) {
            if (dialog.prSort) {
                dialog.prSort = 0;
            } else {
                dialog.prSort = 1;
            }
            if (val == 0) {
                dialog.sortColumn = "p83025";
            } else if (val == 1) {
                dialog.sortColumn = "p83023";
            }
            loadPrChart();
        },

        closeWindow: function () {
            $(".Monitor_left_c2_highLt", parent.document).removeClass("Monitor_left_c2_highLt");
            window.parent.closeEqualHourFm();
        }
    },
    mounted: function () {
        this.showEqHourData(2);
    }
});

