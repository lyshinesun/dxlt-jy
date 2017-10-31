/**
 * Created by Administrator on 2016/12/24.
 */
//页面加载时vue
new Vue({
    el: '#dx_tot',
    data: {
        screen3: {
            ps_id: "", //被点击电站的ps_id
            earthChart: null,
            isFrist: true,//是否点击操作页面
            version: "",
            preVersion: false,//之前的版本
            ps_target: 0, //电站指标(1：点击刷新)
            show_dinfo: 0, //是否显示‘电站详细信息’按钮（0：不显示）
            //psScheme: 2,//电站类型; (2:组串式,显示单元；其他 显示逆变器)
            showEarthOrChina: true//关闭弹出框时显示 true:3D地球，false;ChinaMap
        },
        psObj: {
            psIdArr: [],
            psSchemeArr: []
        },
        earthTimer: null,
        topTimer: null,
        allTimer: null,
        myDate: new Date(),
        //左上角
        fd_all_power_day: '--',    //今日发电
        fd_all_pw: '--',           //当前功率
        fd_all_power_year: '--',   //集团当年累计发电
        fd_all_power: '--',        //累计总发电

        fd_all_power_day_unit: '',
        fd_all_pw_unit: '',
        fd_all_power_year_unit: '',
        fd_all_power_unit: '',

        //左3   年完成率
        fd_scheduledata: '--',

        //右中节能减排
        fd_co2_reduce: '--',    //co2
        fd_coal_reduce: '--',  //煤
        fd_tree_reduce: '--',  //树
        fd_so2_reduce: '--',   //so2

        //右下电站建设
        fd_intercon_cap_finish: '', //并网
        fd_station_count_finish: '',   //并网座数
        fd_intercon_cap_on: '', //在建
        fd_station_count_on: '',   //在建座数
        fd_intercon_cap_undo: '', //未建
        fd_station_count_undo: '',   //未建座数
        fd_intercon_cap: '',    //总MW数
        fd_unit: '',   //总MW单位
        fd_safety_daycount: '--',   //安全天数

        options: [],

        fd_station_name: '', //项目名称
        fd_city: '', //地理位置
        fd_pw_capacity: '', //装机功率
        fd_station_desc: '', //项目描述

    },
    methods: {
        //关闭缩略框
        closeLayer: function () {
            $("#grayLayer").removeClass("grayLayer");
            this.screen3.ps_id = "";
            $(".maps_show").removeClass("mapbox_show");
        },

        //flat点击
        powerInfo_detail: function (obj) {
            var _this = this;
            $("#grayLayer").addClass("grayLayer");
            this.screen3.ps_id = $(obj).attr('id');
            if ($(obj).attr('class') == 'location') {
                //并网
                var url = "dialog/dialog_powerDetail.html?ps_id=" + this.screen3.ps_id;
                $("#equalHourFm").attr("src", url);
                $("#equalHourFm").slideToggle();

            } else {
                //未建、在建
                $('#showPsInfo').addClass('mapbox_show');
                var Parameters = {
                    "parameters": {
                        "stationid": this.screen3.ps_id
                    },
                    "foreEndType": 2,
                    "code": "20000010"
                };
                vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                    if (res.success) {
                        var result = res.data;
                        _this.fd_station_name = result.fd_station_name;  //项目名称
                        _this.fd_city = result.fd_city; //地理位置
                        if (result.fd_station_name) {
                            _this.fd_pw_capacity = result.fd_station_name.match(/\d/ig)[0] + 'MWp'; //装机功率
                        }
                        _this.fd_station_desc = result.fd_station_desc; //项目描述
                    }
                });
            }
        },

        //获取本月天数
        getDays: function () {
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var days;

            //当月份为二月时，根据闰年还是非闰年判断天数
            if (month == 2) {
                days = year % 4 == 0 ? 29 : 28;

            }
            else if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
                //月份为：1,3,5,7,8,10,12 时，为大月.则天数为31；
                days = 31;
            }
            else {
                //其他月份，天数为：30.
                days = 30;

            }
            return days;
        },
        //初始化窗口css
        initPageCss: function () {
            $(".index-main").css("height", $(window).height() - 111);
            $(".index-main").css("width", $(window).width());
            $(".index-center").css("width", $(window).width() - 421 - 421 - 40);
            $(".index-center").css("height", $(window).height() - 111);
            $("#main").css("height", $(window).height() - 271);
            $(window).resize(function () {
                $(".index-main").css("height", $(window).height() - 111);
                $(".index-main").css("width", $(window).width());
                $(".index-center").css("width", $(window).width() - 421 - 421 - 40);
                $(".index-center").css("height", $(window).height() - 111);

                $("#main").css("height", $(window).height() - 271);
                $(".clist-main").css("height", $(window).height() - 150);
                $(".clist").css("height", $(window).height() - 111);
            });

        },
        /*3D earth draw*/
        draw3DMap: function () {
            var _this = this;
            require.config({
                paths: {
                    'echarts': 'js/plugin/echart',
                    'echarts-x': 'js/3d'
                }
            });

            // 动态加载图表进行绘制
            require([
                'echarts',
                'echarts-x',
                // ECharts-X 中 map3d 的地图绘制基于 ECharts 中的 map。
                'echarts/chart/map',
                'echarts-x/chart/map3d'
            ], function (ec) {
                _this.do3DMap(ec);
            });
            if (this.screen3.earthChart) {
                this.screen3.earthChart.dispose();
            }
        },

        //更新地球状态
        refreshEarth: function () {
            var refreshMin = 60;
            clearInterval(this.earthTimer);
            this.earthTimer = setInterval(function () {
                var refreshDate = new Date();
                var hour = refreshDate.getHours();
                if (hour == 6 || hour == 5) {//5点、6点刷新
                    window.location.reload(true);
                }
            }, 60 * 1000 * refreshMin);
        },

        do3DMap: function (ec) {
            this.screen3.earthChart = ec.init(document.getElementById('main'));
            var ecConfig = require('echarts/config'), _this = this;

            this.screen3.earthChart.setOption({
                title: {
                    text: '',
                    x: 'center',
                    textStyle: {
                        color: '#fff'
                    }
                },
                mapLocation: {
                    x: 0,
                    y: 0,
                    width: '100%',
                    height: '100%'
                },
                tooltip: {
                    formatter: function (data) {
                        if (data.name == "China") {
                            return LANG["China"];
                        }
                        return data.name;
                    }
                },
                series: [{
                    type: 'map3d',
                    mapType: 'world',     //地图类型
                    //background:'images/starfield.jpg',  //全景背景图

                    baseLayer: {
                        backgroundColor: '',
                        backgroundImage: 'images/earth.jpg',
                        quality: 'high',
                        heightImage: 'images/elev_bump.jpg'
                    },
                    light: {
                        show: true,
                        ambientIntensity: 0.5
                    },
                    roam: {
                        autoRotate: true,
                        autoRotateAfterStill: 2,
                        focus: 'China',
                        zoom: 1, //初始化的缩放大小。
                        minZoom: 1, //最小缩放值
                        maxZoom: 1.5, //最大缩放值
                        preserve: true
                    },
                    light: {
                        show: true,
                        // Use the system time
                        //time: '2016-09-10 21:09:09',
                        sunIntensity: 1,
                        ambientIntensity: 0.5//环境光照强度，有时候为了更清楚的展现地球暗面的信息，需要把这个值调高。
                    },
                    surfaceLayers: [{
                        type: 'texture',
                        distance: 5,
                        image: 'images/clouds.png'
                    }],
                    //selectedMode: 'single',  //多选mutiple

                    itemStyle: {
                        normal: {
                            label: {
                                show: true
                            },
                            borderWidth: 1,
                            borderColor: 'yellow',
                            areaStyle: {
                                color: 'rgba(0, 0, 0, 0)'
                            }
                        }
                    },
                    data: [{
                        name: 'China',
                        selected: true   //默认选中区域
                    }]
                }]
            });

            //地图坐标图标点击
            this.screen3.earthChart.on(ecConfig.EVENT.CLICK, function (param) {
                var name = param.name;
                if (name == 'China') {
                    _this.screen3.showEarthOrChina = false;
                    _this.chinaClick();
                }
            });
        },

        //3d地球点击执行函数
        chinaClick: function () {
            $(".Monitor_header_tag_list ul li").removeClass("grayDiv");//电站状态全选中
            $('#main').hide();
            $(".Monitor_center").show();
            $('#img_china').show();
            this.getMapByUser();
        },

        //获取flatChina地图
        getMapByUser: function () {
            var _this = this;
            var Parameters = {
                "parameters": {"stationid": "", "statusstr": ""},
                "foreEndType": 2,
                "code": "20000006"
            };
            vlm.loadJson("", JSON.stringify(Parameters), platMap);

            function platMap(result) {
                //console.log(result);
                var mapStr = $('#tpl').html(), dataArr = result.data, optStr = '';
                var mapdata = ejs.render(mapStr, {dataArr: dataArr});
                $('#img_china').html(mapdata);
                var optStr = '<option>' + '请输入电站名称' + '</option>';//电站查找下拉框
                for (var i = 0; i < dataArr.length; i++) {
                    optStr += "<option>" + dataArr[i]["fd_station_name"] + "</option>";
                }
                $("#psSearchName").html(optStr);
                $('#psSearchName').select2();
                $("#img_china >div").click(function () {
                    _this.powerInfo_detail($(this));
                });

            }
        },

        //平面地图title的三个选项
        powerStatus: function (e) {
            var obj = null;
            if ($(e.target).parent()[0].tagName == 'LI' || $(e.target)[0].tagName == 'LI') {
                if ($(e.target).parent()[0].tagName == 'LI') {
                    obj = $(e.target).parent();
                } else if ($(e.target)[0].tagName == 'LI') {
                    obj = $(e.target);
                }
                if (obj.attr('data-powerStatus') == 'complete') {
                    $(".location").toggle();
                    if ($("#mtag1").hasClass("grayDiv")) {
                        $("#mtag1").removeClass("grayDiv");
                    } else {
                        $("#mtag1").addClass("grayDiv");
                    }
                } else if (obj.attr('data-powerStatus') == 'building') {
                    $(".location2").toggle();
                    if ($("#mtag2").hasClass("grayDiv")) {
                        $("#mtag2").removeClass("grayDiv");
                    } else {
                        $("#mtag2").addClass("grayDiv");
                    }
                } else if (obj.attr('data-powerStatus') == 'scheme') {
                    $(".location3").toggle();
                    if ($("#mtag3").hasClass("grayDiv")) {
                        $("#mtag3").removeClass("grayDiv");
                    } else {
                        $("#mtag3").addClass("grayDiv");
                    }
                }
            }

        },

        //flatmap 返回
        mapBack: function () {
            $(".Monitor_center").hide();
            $('#img_china').hide();
            $('#main').show();
        },

        //电站建设情况图表
        loadPowerNumChart: function (dz_data, pieName, lengendData, title) {
            this.drawPowerNumChart(echarts, dz_data, pieName, lengendData, title);
        },

        drawPowerNumChart: function (ec, dz_data, pieName, lengendData, title) {
            var powerNum_option = {
                /*tooltip : {
                 trigger: 'item',
                 formatter: "{a} <br/>{b} : {c} ({d}%)"
                 },*/
                title: {
                    show: false,
                    text: title,
                    x: '35',
                    y: '90',
                    itemGap: 20,
                    textStyle: {
                        color: '#ffffff',
                        fontFamily: 'Microsoft YaHei',
                        fontSize: 18,
                        fontWeight: '100'
                    }
                },
                color: ['#2F7FFA', '#20B126', '#FDD600'],
                series: [
                    {
                        hoverAnimation: false,
                        name: pieName,
                        type: 'pie',
                        center: ['50%', '45%'],
                        radius: ['55%', '90%'],
                        itemStyle: {
                            normal: {
                                color: function (value) {
                                    return value.data.color;
                                },
                                label: {
                                    show: false
                                },
                                labelLine: {
                                    show: false
                                }
                            }
                        },
                        data: dz_data
                    }
                ]
            };

            var powerNumChart = ec.init(document.getElementById('powernumChart'));
            //window.onresize = powerNumChart.resize;
            powerNumChart.setOption(powerNum_option, true);
        },

        // //获取总电量、节能减排、电站建设数据
        // getAllPower: function () {
        //     var _this = this;
        //     var Parameters = {
        //         "parameters": {
        //             "CultureName": "",
        //             "VerifiationCCodeType": "1",
        //             "datas": ["ALL_POWER_DAY", "all_power", "ALL_PW", "all_power_year"]
        //         },
        //         "foreEndType": 2,
        //         "code": "20000003"
        //     };
        //     //console.log(Parameters);
        //     vlm.loadJson("", JSON.stringify(Parameters), function (result) {
        //         //console.log(result);
        //         if (result.success) {
        //             var data = result.data;
        //             //左上角数值
        //             _this.fd_all_power_day = data.fd_all_power_day;
        //             _this.fd_all_pw = data.fd_all_pw;
        //             _this.fd_all_power_year = data.fd_all_power_year.toFixed(2);
        //             _this.fd_all_power = data.fd_all_power;
        //             //单位
        //             _this.fd_all_power_day_unit = data.fd_all_power_day_unit;
        //             _this.fd_all_pw_unit = data.fd_all_pw_unit;
        //             _this.fd_all_power_year_unit = data.fd_all_power_year_unit;
        //             _this.fd_all_power_unit = data.fd_all_power_unit;
        //         } else {
        //             alert(result.message);
        //         }
        //
        //     });
        // },


        //获取总电量数据2017-07-26
        getAllPower_new: function () {
            var _this = this;

            $.ajax({
                url: vlm.serverAddr + "stationInfo/stationInfo",	//请求地址
                dataType: "json",
                type: "GET",
                traditional: true,//这里设置为true
                success: function (result) {
                    // console.log(result);
                    if (result.code == 200) {
                        var data = result.data;
                        //左上角数值
                        _this.fd_all_power_year = result.nlj.toFixed(2);
                        _this.fd_all_power = result.lj.toFixed(2);
                        _this.fd_all_power_day = result.todayFd.toFixed(2);
                        _this.fd_all_pw = result.todayPower.toFixed(0);
                        //单位
                        _this.fd_all_power_day_unit = result.dunit+"kWh";
                        _this.fd_all_pw_unit = "kW";
                        _this.fd_all_power_year_unit = result.yunit+"kWh";
                        _this.fd_all_power_unit = result.ljunit+"kWh";
                    }
                }
            });
        },


        getOther: function () {
            var _this = this;
            var Parameters = {
                "parameters": {
                    "CultureName": "",
                    "VerifiationCCodeType": "1",
                    "datas": ["ALL_POWER_DAY", "all_power", "ALL_PW", "all_power_year"]
                },
                "foreEndType": 2,
                "code": "20000003"
            };
            //console.log(Parameters);
            vlm.loadJson("", JSON.stringify(Parameters), function (result) {
                //console.log(result);
                if (result.success) {
                    var data = result.data;

                    //节能减排
                    _this.fd_co2_reduce = data.fd_co2_reduce + data.fd_co2_reduce_unit;
                    _this.fd_coal_reduce = data.fd_coal_reduce + data.fd_coal_reduce_unit;
                    _this.fd_tree_reduce = data.fd_tree_reduce + data.fd_tree_reduce_unit;
                    _this.fd_so2_reduce = data.fd_so2_reduce + data.fd_so2_reduce_unit;

                    //安全运营天数
                    _this.fd_safety_daycount = data.fd_safety_daycount;


                } else {
                    alert(result.message);
                }

            });
        },

        //电站建设
        getBuilding: function () {
            var _this = this;

            $.ajax({
                url: vlm.serverAddr + "stationInfo/getPsStatuNum",	//请求地址
                dataType: "json",
                type: "GET",
                traditional: true,//这里设置为true
                success: function (result) {
                    if (result.code == 0) {
                        //电站建设
                        var dz_data = [];
                        var pieName = LANG["powerStationConstruct"];
                        var lengendData = [];
                        var title = 'abc';
                        var ps_exist_capacity, ps_just_capacity, no_just_capacity;
                        _this.fd_intercon_cap = result.map.cap;

                        var colorArray = ["#0CCA26", "#FDD600", "#2E7FF9"];

                        // for (var i = 0; i < data.tbpowertypes.length - 1; i++) {
                        //     if (data.tbpowertypes[i].fd_station_status == 2) { //并网
                        //         _this.fd_intercon_cap_finish = data.tbpowertypes[i].fd_intercon_cap + data.tbpowertypes[i].fd_unit;
                        //         ps_exist_capacity = data.tbpowertypes[i].fd_intercon_cap;
                        //         _this.fd_station_count_finish = data.tbpowertypes[i].fd_station_count + LANG["psUnit_zuo"];
                        //     } else if (data.tbpowertypes[i].fd_station_status == 1) { //在建
                        //         _this.fd_intercon_cap_on = data.tbpowertypes[i].fd_intercon_cap + data.tbpowertypes[i].fd_unit;
                        //         ps_just_capacity = data.tbpowertypes[i].fd_intercon_cap;
                        //         _this.fd_station_count_on = data.tbpowertypes[i].fd_station_count + LANG["psUnit_zuo"];
                        //
                        //     } else if (data.tbpowertypes[i].fd_station_status == 0) { //未建
                        //         _this.fd_intercon_cap_undo = data.tbpowertypes[i].fd_intercon_cap + data.tbpowertypes[i].fd_unit;
                        //         no_just_capacity = data.tbpowertypes[i].fd_intercon_cap;
                        //         _this.fd_station_count_undo = data.tbpowertypes[i].fd_station_count + LANG["psUnit_zuo"];
                        //
                        //     }
                        // }
                        _this.fd_intercon_cap_finish = result.map.bcap + 'MW';
                        ps_exist_capacity = result.map.bcap;
                        _this.fd_station_count_finish = result.map.b + LANG["psUnit_zuo"];

                        _this.fd_intercon_cap_on = result.map.zcap + 'MW';
                        ps_just_capacity = result.map.zcap;
                        _this.fd_station_count_on = result.map.z + LANG["psUnit_zuo"];

                        _this.fd_intercon_cap_undo = result.map.wcap + 'MW';
                        no_just_capacity = result.map.wcap;
                        _this.fd_station_count_undo = result.map.w + LANG["psUnit_zuo"];


                        var ps_array = [ps_exist_capacity, ps_just_capacity, no_just_capacity];
                        for (var i = 0; i < ps_array.length; i++) {
                            var tempp = {};
                            tempp["value"] = ps_array[i];
                            tempp["color"] = colorArray[i];
                            dz_data.push(tempp);
                        }
                        _this.loadPowerNumChart(dz_data, pieName, lengendData, title);
                    }
                }
            });
        },


        //PR define
        /*getPRChart: function (sortType) {
            //console.log(sortType);
            this.psObj.psIdArr.length = 0;
            var _this = this;
            if (!sortType) {
                sortType = "1";
            }
            var dates = new Date();
            var endDate = dates.getFullYear() + '-' + (dates.getMonth() + 1) + '-' + dates.getDate() + 'T' + dates.getHours() + ':' + dates.getMinutes() + ':' + dates.getSeconds();
            var endDateStr = vlm.Utils.format_date(endDate, 'YmdHis');
            var startDateStr = vlm.Utils.currentMonth();
            console.log('endDateStr' + endDateStr, 'startDateStr' + startDateStr)
            var Parameters = {
                "parameters": {
                    "ctype": "1",
                    "sorttype": "1",
                    "sort": sortType,
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "100",
                    "stationid": ""
                },
                "foreEndType": 2,
                "code": "20000002"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (result) {
                //console.log(result);
                var listData = result.data;
                if (listData == null || listData == "" || listData.length == 0) {
                    console.log("获取性能排名数据为空");
                    return;
                }
                var xdata = [];
                var ydata1 = [];
                var ydata2 = [];
                var length = listData.length;
                if (length > 5) {
                    length = 5;
                }
                listData = _this.sortCapacityArr(listData, sortType);
                for (var i = 0; i < length; i++) {
                    var buildString = "", buildIndex = 0;
                    // if (listData[i].fd_station_name.indexOf('MW') == -1) {
                    //     buildString = '--'
                    // } else {
                    //     buildString = listData[i].fd_station_name.match(/\d+MW/ig)[0];
                    // }
                    // buildIndex = listData[i].fd_station_name.indexOf(buildString);
                    // xdata.push(
                    //     {
                    //         value: listData[i].fd_station_name.substring(0, buildIndex) + "\n" + buildString,
                    //         textStyle: {             //详见textStyle
                    //             //color : 'red'
                    //         }
                    //     }
                    // );
                    xdata.push(
                        {
                            value: listData[i].fd_station_name,
                            textStyle: {             //详见textStyle
                                //color : 'red'
                            }
                        }
                    );
                    _this.psObj.psIdArr.push(listData[i].fd_station_id);
                    var cap_value = listData[i].pr;
                    if (cap_value == null || cap_value == undefined || !$.isNumeric(cap_value)) {
                        ydata1.push(0);
                        ydata2.push(100);
                    } else {
                        cap_value = parseInt(cap_value);
                        ydata1.push(cap_value);
                        ydata2.push(100 - cap_value);
                    }
                }
                _this.drawCapacityChart(xdata, ydata1, ydata2);
            })
        },*/
        /*java接口测试性能排名*/
        getPRChart: function (sortType) {
            //console.log(sortType);
            this.psObj.psIdArr.length = 0;
            var _this = this;
            if (!sortType) {
                sortType = "1";
            }
            var dates = new Date();
            var sortDate = dates.getFullYear() + '-' + (dates.getMonth() + 1)
            // console.log('sortDate' + sortDate)
            /*-------c接口----------*/
            /*var Parameters = {
                "parameters": {
                    "ctype": "1",
                    "sorttype": "1",
                    "sort": 2,
                    "starttime": "20171001000000",
                    "endtime": "20171016142459",
                    "topn": "100",
                    "stationid": ""
                },
                "foreEndType": 2,
                "code": "20000002"
            };*/
            /*vlm.loadJson("", JSON.stringify(Parameters), function (result) {
                //console.log(result);
                var listData = result.data;
                if (listData == null || listData == "" || listData.length == 0) {
                    console.log("获取性能排名数据为空");
                    return;
                }
                var xdata = [];
                var ydata1 = [];
                var ydata2 = [];
                var length = listData.length;
                if (length > 5) {
                    length = 5;
                }
                listData = _this.sortCapacityArr(listData, sortType);
                for (var i = 0; i < length; i++) {
                    var buildString = "", buildIndex = 0;
                    // if (listData[i].fd_station_name.indexOf('MW') == -1) {
                    //     buildString = '--'
                    // } else {
                    //     buildString = listData[i].fd_station_name.match(/\d+MW/ig)[0];
                    // }
                    // buildIndex = listData[i].fd_station_name.indexOf(buildString);
                    // xdata.push(
                    //     {
                    //         value: listData[i].fd_station_name.substring(0, buildIndex) + "\n" + buildString,
                    //         textStyle: {             //详见textStyle
                    //             //color : 'red'
                    //         }
                    //     }
                    // );
                    xdata.push(
                        {
                            value: listData[i].fd_station_name,
                            textStyle: {             //详见textStyle
                                //color : 'red'
                            }
                        }
                    );
                    _this.psObj.psIdArr.push(listData[i].fd_station_id);
                    var cap_value = listData[i].pr;
                    if (cap_value == null || cap_value == undefined || !$.isNumeric(cap_value)) {
                        ydata1.push(0);
                        ydata2.push(100);
                    } else {
                        cap_value = parseInt(cap_value);
                        ydata1.push(cap_value);
                        ydata2.push(100 - cap_value);
                    }
                }
                _this.drawCapacityChart(xdata, ydata1, ydata2);
            });*/
            /*----------------------------------------------------*/
            // java接口替换
            $.ajax({
                url:vlm.serverAddr+'stationInfo/getPerSort',
                type:'get',
                dataType:'json',
                data:{
                    'date': sortDate,
                    'type': sortType
                },
                success:function(res){
                    // console.log(res)
                    var listData = res.list;
                    if (listData == null || listData == "" || listData.length == 0) {
                        console.log("获取性能排名数据为空");
                        return;
                    }
                    var xdata = [];
                    var ydata1 = [];
                    var ydata2 = [];
                    var length = listData.length;
                    // if (length > 5) {
                    //     length = 5;
                    // }
                    listData = _this.sortCapacityArr(listData, sortType);
                    for (var i = 0; i < length; i++) {
                        var buildString = "", buildIndex = 0;
                        xdata.push(
                            {
                                value: listData[i].psName,
                                textStyle: {             //详见textStyle
                                    //color : 'red'
                                }
                            }
                        );
                        _this.psObj.psIdArr.push(listData[i].stationCode);
                        var cap_value = listData[i].pr;
                        if (cap_value == null || cap_value == undefined || !$.isNumeric(cap_value)) {
                            ydata1.push(0);
                            ydata2.push(100);
                        } else {
                            cap_value = parseInt(cap_value);
                            ydata1.push(cap_value);
                            ydata2.push(100 - cap_value);
                        }
                    }
                    _this.drawCapacityChart(xdata, ydata1, ydata2);
                },
                error:function(error){
                    console.log(error)
                },
            });
            /*-----------------------------------------------------*/
        },
        //左中性能排名排序
        sortCapacityArr: function (arr, sortType) {
            if (arr && arr.length > 0) {
                if (sortType == 1) {
                    for (var i = 0; i < arr.length - 1; i++) {
                        var index = i;
                        for (var j = i + 1; j < arr.length; j++) {
                            var temVal = arr[index].pr;
                            var curVal = arr[j].pr;
                            if (($.isNumeric(temVal) && $.isNumeric(curVal) && curVal > temVal) || (!$.isNumeric(temVal)) && $.isNumeric(curVal)) {
                                index = j;
                            }
                        }
                        var tem = arr[index];
                        arr[index] = arr[i];
                        arr[i] = tem;
                    }
                } else {
                    for (var i = 0; i < arr.length - 1; i++) {
                        var index = i;
                        for (var j = i + 1; j < arr.length; j++) {
                            var temVal = arr[index].pr;
                            var curVal = arr[j].pr;
                            if (($.isNumeric(temVal) && $.isNumeric(curVal) && curVal < temVal) || (($.isNumeric(temVal)) && !$.isNumeric(curVal))) {
                                index = j;
                            }
                        }
                        var tem = arr[index];
                        arr[index] = arr[i];
                        arr[i] = tem;
                    }
                }
            }
            return arr;
        },

        //加载性能排名图表
        drawCapacityChart: function (xdata, ydata1, ydata2) {
            var _this = this;
            var option = {
                title: {
                    show: false,
                    text: LANG["yy1.PerformanceRankingM"],
                    x: 'left',                 // 水平安放位置，默认为左对齐，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: 'top',
                    textStyle: {
                        fontFamily: 'Microsoft YaHei',
                        fontSize: 26,
                        fontWeight: 200,
                        color: 'white'
                    },
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: function (param) {
                        return param[0].name + ":" + param[0].value + "%";
                    }
                },
                legend: {
                    show: false,
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: '290',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '20',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: ['PR']
                },
                // 网格
                grid: {
                    x: 30,
                    y: 10,
                    x2: 0,
                    y2: 40,
                    width: 340,
                    height: 170,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc'
                },

                calculable: true,
                xAxis: [
                    {
                        type: 'category',
                        axisLine: {
                            show: false,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,//逆时针显示标签，不让文字叠加
                            interval: 0,
                            textStyle: {
                                color: '#ffffff',
                                fontFamily: 'Microsoft YaHei'
                            }
                        },
                        axisTick: {
                            show: false
                        },
                        splitLine: {
                            show: false
                        },
                        boundaryGap: [0, 0.01],

                        data: xdata//['荣威\n地面', '大众\n一厂', '大众\n总办', '荣威\n屋顶', '大众\n三厂', '荣威\n车棚', '设计\n中心']
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        axisLine: {
                            show: false,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ffffff'
                            }
                        },
                        axisLabel: {
                            show: false,
                            textStyle: {
                                color: '#ffffff'
                            }
                        },
                        axisTick: {
                            show: false
                        },
                        splitLine: {
                            show: false
                        },
                        boundaryGap: [0, 0.01]
                    }
                ],
                series: [
                    {
                        name: 'PR',
                        type: 'bar',
                        stack: 'a',
                        itemStyle: {
                            normal: {
                                color: "#139FF6"
                            }
                        },
                        barMaxWidth: 30,
                        data: ydata1
                    },
                    {
                        name: '',
                        type: 'bar',
                        stack: 'a',
                        itemStyle: {
                            normal: {
                                color: "#123249",//柱状图颜色随机
                                label: {
                                    show: true,
                                    position: 'top',
                                    formatter: function (params) {
                                        return (100 - params.value) + "%";
                                    },
                                    textStyle: {
                                        color: '#00F3FF'
                                    }
                                }
                            },

                        },
                        barMaxWidth: 30,
                        data: ydata2
                    }
                ]
            };
            var ptChart = echarts.init(document.getElementById('capacity'));
            ptChart.setOption(option);
            //var ecConfig = require('echart/config');
            //ptChart.on(ecConfig.EVENT.CLICK, function(params){
            //
            //});
            ptChart.on('click', function (params) {
                var index = params.dataIndex;
                event.stopPropagation();
                _this.screen3.ps_id = _this.psObj.psIdArr[index];
                $("#grayLayer").addClass("grayLayer");
                _this.psDetailInfo();
            });
        },

        //性能排名点击后的电站详细信息
        psDetailInfo: function () {
            $("#showPsInfo").removeClass('mapbox_show');
            if (this.screen3.ps_id) {
                var url = "dialog/dialog_powerDetail.html?ps_id=" + this.screen3.ps_id;
                $("#equalHourFm").attr("src", url);
                $("#equalHourFm").slideToggle();
            }
        },

        //PR电站性能点击
        PR_click: function (e) {
            //console.log(e.target);
            if ($(e.target).parent().hasClass('capacity_btn')) {
                $('.capacity_btn').removeClass('on');
                $(e.target).parent().addClass('on');
                this.getPRChart($(e.target).parent().attr('data-sortType'));
            }
        },

        //当年发电计划发送请求 getYearPowerPlan
        loadPlanChart: function () {
            var _this = this;
            //var param = {};
            //param["date"] = myDate.getFullYear();
            //param["date_type"] = "1";//年份
            //param["ps_id"] = screen3.ps_id;
            var endDateStr = vlm.Utils.nextYear();
            var startDateStr = vlm.Utils.currentYear();
            var Parameters = {
                "parameters": {
                    "datatype": "year",
                    "sorttype": "1",
                    "sort": "1",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "7",
                    "stationid": ""
                },
                "foreEndType": 2,
                "code": "20000004"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                //动态plan
                if (res.success) {
                    var result = res.data;
                    var newActualData = [], planData = [], unit = result.fd_unit,
                        planArray = result.datas, actualArray = result.datayears;
                    _this.fd_scheduledata = actualArray[0].fd_scheduledata + '%';
                    for (var i = 0; i < planArray.length; i++) {
                        planData.push(planArray[i].fd_sched_power_mon);
                        newActualData.push(planArray[i].datapower);
                    }
                    _this.drawPowerPlanChart(dealEchartBarArr(newActualData), dealEchartBarArr(planData), unit);

                } else {
                    alert(res.message);
                }
            });
        },

        //绘制当年发电计划chart
        drawPowerPlanChart: function (actualData, planData, unit) {
            //完成率
            var completionRt = [], _this = this;
            var temArr = addUpArr(actualData);
            var temSum = addUpArr(planData);
            var allActual = sumArrayData(actualData);
            var allPlan = 0;
            var now = new Date();
            var month = now.getMonth() + 1;
            for (var i = 0; i < planData.length; i++) {
                var plan = isNotNull(planData[i]) ? planData[i] : 0;
                allPlan = allPlan + parseFloat(plan);
                if (i < month) {
                    completionRt.push(CalculatedCompletionRate(temArr[i], temSum[i]));
                } else {
                    completionRt.push('--');
                }

            }
            var yearRat = isNotNull(allPlan) ? (toFix(allActual * 100 / allPlan, 2) + "%") : "--";//年完成率
            $("#yearCompleteRate").html(yearRat);
            var option = {
                title: {
                    show: false,
                    text: LANG["yy1.PowerGenerationPalnY"],
                    x: 'left',                 // 水平安放位置，默认为左对齐，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: 'top',
                    textStyle: {
                        fontFamily: 'Microsoft YaHei',
                        fontSize: 26,
                        fontWeight: 200,
                        color: 'white'
                    },
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        var year = _this.myDate.getFullYear();
                        var dataName = data[0].name;
                        if (typeof dataName == 'undefined' || dataName == null || dataName == "") {
                            for (var i = 0; i < data.length; i++) {
                                var temDname = data[i].name;
                                if (typeof temDname !== 'undefined' && temDname !== null && temDname !== "") {
                                    dataName = temDname;
                                    break;
                                }
                            }
                        }
                        var str = year + "/" + dataName;
                        for (var i = 0; i < data.length; i++) {
                            if (LANG["actualGeneration"] == data[i].seriesName || LANG["planGeneration"] == data[i].seriesName) {
                                str += "<p align='left'>" + data[i].seriesName + "：" + dealEchartToolTip(data[i].value) + unit;
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
                    y: '-3',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["planGeneration"], LANG["actualGeneration"], LANG["1_1_planned_completion_rate"]]
                },
                // 网格
                grid: {
                    x: 40,
                    y: 45,
                    x2: 35,
                    y2: 30,
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
                                color: '#FFFFFF'
                            }
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#FFFFFF'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        boundaryGap: [0, 0.01],
                        data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: unit,
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#FFFFFF'
                            }
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#FFFFFF'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisTick: axisTickObj
                    },
                    {
                        type: 'value',
                        name: "（%）",
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
                        min: 0,
                        max: 120,
                        splitNumber: 6,
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisTick: axisTickObj
                    }
                ],
                series: [
                    {
                        name: LANG["planGeneration"],
                        type: 'bar',
                        barMaxWidth: 6,
                        smooth: true,
                        itemStyle: {
                            normal: {
                                color: '#0096ff',
                            }
                        },
                        data: planData
                    },
                    {
                        name: LANG["actualGeneration"],
                        type: 'bar',
                        barMaxWidth: 6,
                        smooth: true,
                        itemStyle: {
                            normal: {
                                color: '#00f4fe',
                            }
                        },
                        symbol: 'none',
                        data: actualData
                    },
                    {
                        name: LANG["1_1_planned_completion_rate"],
                        type: 'line',
                        yAxisIndex: 1,
                        smooth: true,
                        itemStyle: {
                            normal: {
                                color: '#fdd600',
                                lineStyle: {        // 系列级个性化折线样式
                                    width: 2
                                }
                            }
                        },
                        data: completionRt
                    }
                ]

            };
            var ptChart = echarts.init(document.getElementById('plan'));
            ptChart.setOption(option);
        },

        //右上角发电趋势show
        showGenTrends: function (e) {
            var genTrendsDateType = $(e.target).parent().attr('data-dateType');
            var _this = this;
            $(".Mc4_con .loadingDiv").show();
            var temChart = echarts.init(document.getElementById('power'));
            temChart.clear();

            $(".trends_btn").removeClass("on");
            if (genTrendsDateType == 3) {//year
                $("#powerTrendTitle").text(LANG["generationTrend_year"]);
                $(".trends_btn:eq(2)").addClass("on");
            } else if (genTrendsDateType == 2 || genTrendsDateType == undefined) {//month
                genTrendsDateType = '2';
                $("#powerTrendTitle").text(LANG["generationTrend_month"]);
                $(".trends_btn:eq(1)").addClass("on");
            } else if (genTrendsDateType == 0) {//day
                $("#powerTrendTitle").text(LANG["generationTrend_day"]);
                $(".trends_btn:eq(0)").addClass("on");
            }
            _this.getResultTrends(genTrendsDateType);

        },

        //发电趋势首次加载或者点击后发送请求
        getResultTrends: function (dateType) {
            $(".Mc4_con .loadingDiv").show();
            var _this = this;
            var dateStr = '', startDateStr = '';
            switch (dateType) {
                case '0': //日
                    dateStr = '0';
                    startDateStr = vlm.Utils.currentDay();
                    break;
                case '2': //月
                    dateStr = '2';
                    startDateStr = vlm.Utils.currentMonth();
                    break;
                case '3':  //年
                    dateStr = '3';
                    startDateStr = vlm.Utils.currentYear();
                    break;
                default :
                    ;
            }
            var dates = new Date();
            var endDate = dates.getFullYear() + '-' + (dates.getMonth() + 1) + '-' + dates.getDate() + 'T' + dates.getHours() + ':' + dates.getMinutes() + ':' + dates.getSeconds();
            var endDateStr = vlm.Utils.format_date(endDate, 'YmdHis');

            var Parameters = {
                "parameters": {
                    "stationtype": "all",
                    "timetype": dateStr,
                    "sorttype": "1",
                    "sort": "2",
                    "starttime": startDateStr,
                    "endtime": endDateStr,
                    "topn": "300",
                    "stationid": "ALL"
                },
                "foreEndType": 2,
                "code": "20000005"
            }
            //console.log(Parameters);
            vlm.loadJson("", JSON.stringify(Parameters), function (data) {
                if (data.success) {
                    if (dateStr == '2') {
                        _this.dealPowerData_month(data);
                    } else if (dateStr == '0') {
                        _this.dealPowerData_day(data);
                    } else {
                        _this.dealPowerData_year(data);
                    }
                } else {
                    alert(data.message);
                }
            })

        },

        //解析发电趋势数据(月)
        dealPowerData_month: function (res) {

            var result = res.data,
                _this = this,
                todayPower = '',
                unit = result.fd_unit,
                actualData = [];
            if (result.fd_datas.length == 1) {  //当月第一天，只有实时数据
                todayPower = result.fd_datas[0].fd_power_day;
            } else if (result.fd_datas.length > 1) {
                todayPower = result.fd_datas[result.fd_datas.length - 1].fd_power_day;
                for (var i = 0; i < result.fd_datas.length - 1; i++) {
                    actualData.push(result.fd_datas[i].fd_power_day);
                }
            }
            var date = _this.myDate.getDate();  //当月几号
            var dateCount = _this.getDays();   //当月天数
            var dateDate = [], actualData_today = [];
            for (var i = 1; i <= dateCount; i++) {
                if (i >= date) {
                    actualData.push('--');   //累计未来发电趋势初始为0
                }
                if (date == i) {//今日数据
                    var object = {
                        value: todayPower,
                        itemStyle: {
                            normal: {
                                label: {
                                    show: false,
                                    position: 'top',
                                    formatter: function (data) {
                                        return data.value;
                                    }
                                }
                            }
                        }
                    };
                    actualData_today.push(object);
                } else {
                    actualData_today.push('--');
                }
                dateDate.push(i);
            }
            _this.drawPowerChart_month(actualData, actualData_today, dateDate, unit);
        },

        //绘制月发电趋势chart
        drawPowerChart_month: function (actualData, actualData_today, dateDate, unit) {
            var _this = this;
            var option = {
                title: {
                    show: false,
                    text: LANG["yy1.PowerGenerationTrendsM"],
                    x: 'left',                 // 水平安放位置，默认为左对齐，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: 'top',
                    textStyle: {
                        fontFamily: 'Microsoft YaHei',
                        fontSize: 26,
                        fontWeight: 200,
                        color: 'white'
                    },
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        var year = _this.myDate.getFullYear();
                        var month = _this.myDate.getMonth() + 1;
                        var date = parseInt(_this.myDate.getDate());
                        if (date == data[0].name) {//今日
                            return year + "/" + month + "/" + data[1].name + "<br>" + data[1].seriesName + "：" + data[1].value + unit;
                        } else {
                            return year + "/" + month + "/" + data[1].name + "<br>" + data[0].seriesName + "：" + data[0].value + unit;
                        }
                    }

                },
                legend: {
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: '100px',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '10',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#fff',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["yy1.PowerGeneration"], LANG["todayGeneration"]]
                },
                // 网格
                grid: {
                    x: 45,
                    y: 35,
                    x2: 30,
                    y2: 20,
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
                                color: '#fff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            //interval:0,// 是否显示全部标签，0显示
                            rotate: 0,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#fff'
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
                        name: unit,
                        splitLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#fff'
                            }
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        }
                    }
                ],
                series: [
                    {
                        name: LANG["yy1.PowerGeneration"],
                        type: 'bar',
                        stack: 'sum',
                        barMaxWidth: 6,
                        itemStyle: {
                            normal: {
                                color: '#3EB5FF'
                            }
                        },
                        data: actualData
                    },
                    {
                        name: LANG["todayGeneration"],
                        type: 'bar',
                        stack: 'sum',
                        itemStyle: {
                            normal: {
                                color: '#9DED7C'
                            }
                        },
                        data: actualData_today
                    }
                ]
            };

            var ptChart = echarts.init(document.getElementById('power'));
            ptChart.setOption(option);
            $(".Mc4_con .loadingDiv").hide();
        },

        //处理日发电数据
        dealPowerData_day: function (res) {
            var _this = this;
            if (res.success) {
                var result = res.data;
                var glData = [], actualData = [], dateDate = []; //功率、发电量、日期区间
                for (var i = 0; i < result.fd_datas.length; i++) {
                    if (result.fd_datas[i].fd_pw_curr < 0) {
                        glData.push('0');
                    } else {
                        glData.push(result.fd_datas[i].fd_pw_curr.toFixed(2));
                    }
                    actualData.push(result.fd_datas[i].fd_power_day);
                    dateDate.push(result.fd_datas[i].fd_datetime);
                }
                var unit = result.fd_unit, glUnit = 'kW';//功率单位、发电量单位
                _this.drawDayChart(actualData, glData, dateDate, unit, glUnit);
            } else {
                alert(res.message);
            }
        },

        //绘制日发电趋势
        drawDayChart: function (actualDataDay, glData, dateDate, punit, glUnit) {
            //glData = dealArray(glData);
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        var restStr = "";
                        for (var i = 0; i < data.length; i++) {
                            var obj = data[i];
                            if (i == 0) {
                                restStr += obj.name + "<br>";
                            }
                            restStr += obj.seriesName + ":" + dealEchartToolTip(obj.data) + (LANG["yy1.PowerGeneration"] == obj.seriesName ? punit : glUnit) + "<br>";
                        }
                        return restStr;
                    }
                },
                legend: {
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: '100px',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '10',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#fff',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["yy1.powerful"], LANG["yy1.PowerGeneration"]]
                },
                // 网格
                grid: {
                    x: 45,
                    y: 45,
                    x2: 40,
                    y2: 25,
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
                                color: '#fff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        boundaryGap: [0, 0.01],
                        data: dateDate
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: punit,
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#fff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        }
                    },
                    {
                        type: 'value',
                        name: glUnit,
                        min: 0,
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#fff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        }
                    }
                ],
                series: [
                    {
                        name: LANG["yy1.PowerGeneration"],
                        type: 'bar',
                        smooth: true,
                        yAxisIndex: 0,
                        barWidth: 3,
                        barMaxWidth: 6,
                        itemStyle: {
                            normal: {
                                color: '#00f4fe',
                                lineStyle: {        // 系列级个性化折线样式
                                    width: 1
                                }
                            }
                        },
                        symbol: 'none',
                        yAxisIndex: 0,
                        data: actualDataDay
                    },
                    {
                        name: LANG["yy1.powerful"],
                        type: 'line',
                        smooth: false,
                        itemStyle: {
                            normal: {
                                color: 'yellow',//'#0096ff',
                                lineStyle: {        // 系列级个性化折线样式
                                    width: 3
                                }
                            }
                        },
                        yAxisIndex: 1,
                        data: glData
                    }
                ]

            };
            var ptChartDay = echarts.init(document.getElementById('power'));
            ptChartDay.setOption(option);
            $(".Mc4_con .loadingDiv").hide();
        },

        //处理年发电趋势
        dealPowerData_year: function (res) {
            var _this = this;
            //console.log(res);
            if (res.success) {
                var result = res.data, actualData = [], dateDate = []; //功率、发电量、日期区间
                var glUnit = result.fd_unit;//发电量单位
                for (var i = 0; i < result.fd_datas.length; i++) {
                    //glData.push(result.fd_datas[i].fd_pw_curr);
                    actualData.push(result.fd_datas[i].fd_power_day);
                    dateDate.push(result.fd_datas[i].fd_datetime);
                }
                //for (var i = 0; i < dateDate.length; i++) {
                //    dateDate[i] = dateDate[i].replace("-", "/")
                //}
                _this.drawYearChart(actualData, dateDate, glUnit);
            } else {
                alert(data.message);
            }
        },

        //绘制年发电趋势
        drawYearChart: function (actualDataDay, dateDate, glUnit) {
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: function (data) {
                        var restStr = "";
                        for (var i = 0; i < data.length; i++) {
                            var obj = data[i];
                            restStr += obj.name + "<br>";
                            restStr += LANG["yy1.PowerGeneration"] + ":" + obj.data + glUnit + "<br>";
                        }
                        return restStr;
                    }
                },
                legend: {
                    orient: 'horizontal',      // 布局方式，默认为水平布局，可选为：
                    // 'horizontal' ¦ 'vertical'
                    x: '100px',               // 水平安放位置，默认为全图居中，可选为：
                    // 'center' ¦ 'left' ¦ 'right'
                    // ¦ {number}（x坐标，单位px）
                    y: '10',                  // 垂直安放位置，默认为全图顶端，可选为：
                    // 'top' ¦ 'bottom' ¦ 'center'
                    // ¦ {number}（y坐标，单位px）
                    textStyle: {
                        color: '#fff',
                        fontFamily: 'Microsoft YaHei'
                    },
                    data: [LANG["yy1.PowerGeneration"]]
                },
                // 网格
                grid: {
                    x: 45,
                    y: 35,
                    x2: 10,
                    y2: 20,
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
                                color: '#fff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            rotate: 0,//逆时针显示标签，不让文字叠加
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        boundaryGap: [0, 0.01],
                        data: dateDate
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: glUnit,
                        axisLine: {
                            show: true,
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#fff'
                            }
                        },
                        axisLabel: {
                            show: true,
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        nameTextStyle: {
                            fontFamily: 'Microsoft YaHei'
                        }
                    }
                ],
                series: [
                    {
                        name: LANG["yy1.PowerGeneration"],
                        type: 'bar',
                        smooth: true,
                        yAxisIndex: 0,
                        barWidth: 12,
                        barMaxWidth: 30,
                        itemStyle: {
                            normal: {
                                color: '#00f4fe',
                                lineStyle: {        // 系列级个性化折线样式
                                    width: 1
                                }
                            }
                        },
                        symbol: 'none',
                        data: actualDataDay
                    }
                ]

            };
            var ptChartDay = echarts.init(document.getElementById('power'));
            //var ptChartDay = ec.init(document.getElementById('dayChart'));
            ptChartDay.setOption(option);
            $(".Mc4_con .loadingDiv").hide();
        },

        //点击各模块，相应dialog
        showDialogIframe: function (url, event) {
            $(event.currentTarget).addClass($(event.currentTarget).attr('data-clicktip'));
            $(".main").hide();
            $("#equalHourFm").attr("src", url);
            $("#equalHourFm").slideToggle();
        },

        //检测登录状态
        isLogin: function () {
            var _this = this;

            //检测info
            $.ajax({
                type: "get",
                url: vlm.serverAddr + "sys/user/info",
                data: "",
                dataType: "json",
                success: function (res) {
                    if (res.code == 0) {//用户没过期，更新用户信息
                        window.sessionStorage.userid = res.user.userId;
                        window.sessionStorage.username = res.user.username;
                        window.sessionStorage.login = 1;
                    }
                },
                error: function (res) {
                    //返回的是登录页面
                    window.location.href = "login.html";
                }
            });

        },

    },
    mounted: function () {
        var _this = this;
        this.isLogin(); //是否登录
        this.initPageCss();  //3D地球
        this.draw3DMap();  //3D地球
        this.refreshEarth();  //更新地球状态
        this.getAllPower_new(); //获取总电量
        this.getOther(); //获取节能减排
        this.getBuilding(); //电站建设数据调用
        this.getPRChart();  //性能排名
        this.loadPlanChart(); //发电计划
        this.showGenTrends('2'); //默认首次加载月发电趋势 1-日，月-2，年-3
        clearInterval(this.allTimer);
        this.allTimer = setInterval(function () {
            _this.getOther(); //获取总电量、节能减排(5min)
            _this.getBuilding(); //电站建设数据调用
            _this.getPRChart(); //获取PR(5min)
            _this.loadPlanChart();//当年发电计划(5min)
            _this.showGenTrends('2'); //月发电趋势(5min)
        }, 300000);

        clearInterval(this.topTimer);
        this.topTimer = setInterval(function () {
            _this.getAllPower_new(); //获取总电量(1min)
        }, 60000);
    }
});


//dialog关闭弹窗*/
function closeEqualHourFm() {
    $("#equalHourFm").slideToggle();
    $("#equalHourFm").attr("src", "");
    $("#grayLayer").removeClass("grayLayer");
}


//flat select电站
function searchPS(psName) {
    $("#img_china em").each(function (i, obj) {
        $(obj).removeClass();
        $(obj).parent().css("z-index", "1000");
        $(obj).css("zoom", "");
    });
    if (psName) {
        $("#img_china em").each(function (i, obj) {
            if ($(obj).text().indexOf(psName) >= 0) {
                $(obj).addClass("slideInUp animated").parent().css("z-index", "9999");
            }
        });
    }
}





