new Vue({
    el: '#powerProceeding',
    data: {
        dialog: {
            pageSize: 7,//每页显示条目数
            currentPage: 1, //当前页
            rowCount: 0,//总条目数
            pageCount: 0  //页数
        },
        items: [],
        powerRes: {},  //返回的所有data
    },
    methods: {
        //箭头分页
        arrowChangePage: function () {
            if (event.target == document.getElementById("left_max_btn") && this.dialog.currentPage > 1) {
                this.dialog.currentPage--;
            } else if (event.target == document.getElementById("right_max_btn")) {
                this.dialog.currentPage++;
            }
            this.loadPlanChart();
            this.showPageantion(this.dialog.currentPage - 1);
            this.isPageArrowAvilable();
            this.showCurPage();
        },

        //分页箭头可用
        isPageArrowAvilable: function () {
            if (this.dialog.pageCount > this.dialog.currentPage) {
                $("#right_max_btn").unbind().bind('click', this.arrowChangePage);
                $("#right_max_btn").css("opacity", 1);
                $("#right_max_btn").css("cursor", 'pointer');
            } else {
                $("#right_max_btn").unbind('click', this.arrowChangePage);
                $("#right_max_btn").css("opacity", 0.3);
                $("#right_max_btn").css("cursor", 'default');
            }
            if (1 < this.dialog.currentPage) {
                $("#left_max_btn").unbind().bind('click', this.arrowChangePage);
                $("#left_max_btn").css("opacity", 1);
                $("#left_max_btn").css("cursor", 'pointer');
            } else {
                $("#left_max_btn").unbind('click', this.arrowChangePage);
                $("#left_max_btn").css("opacity", 0.3);
                $("#left_max_btn").css("cursor", 'default');
            }
        },

        //分页下方小图标根据数据初始化
        showPageantion: function (index) {
            var index = index == undefined ? 0 : index;
            this.items = [];
            for (var i = 0; i < this.dialog.pageCount; i++) {
                this.items.push({'active': false});
            }
            this.items[index]['active'] = true;
        },

        //点击小图标tab
        changePage: function (e, index) {
            if (!$(e.target).hasClass('on')) {
                this.dialog.currentPage = index + 1;
                this.loadPlanChart();
                this.showCurPage();
            }
        },

        //当前页选中效果
        showCurPage: function () {
            $("#pagenation li").removeClass("on");
            $("#pagenation li").eq(this.dialog.currentPage - 1).addClass("on");
        },

        //初始请求所有数据
        getAllPlan: function () {
            $(".showm_bottom .loadingDiv").show();
            var _this = this, Parameters = {
                "parameters": {},
                "foreEndType": 2,
                "code": "20000007"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                if (res.success) {
                    var result = res.data;
                    _this.dialog.rowCount = result.length;
                    _this.dialog.pageCount = _this.dialog.rowCount / _this.dialog.pageSize;
                    var remainder = _this.dialog.rowCount % _this.dialog.pageSize;
                    if (remainder != 0) {
                        _this.dialog.pageCount = parseInt(_this.dialog.pageCount) + 1;
                    }
                    //在建容量前端分页调用
                    _this.powerRes = result;   //返回结果
                    _this.loadPlanChart();   //加载当前页chart
                    _this.showPageantion(0);  //展示底部tips
                } else {
                    alert(res.message);
                }
            });
        },
        //在建容量前端分页定义
        loadPlanChart: function () {
            var solar_pgArr = [], booster_pgArr = [], outside_pgArr = [];
            var total_pgArr = [], xData = [], pageList = this.powerRes;
            var startIndex = this.dialog.pageSize * (this.dialog.currentPage - 1);
            var endIndex = this.dialog.currentPage * this.dialog.pageSize,
                buildString = '',
                buildIndex = 0;
            this.isPageArrowAvilable();
            if (this.dialog.rowCount < endIndex) {
                endIndex = this.dialog.rowCount;
            }
            for (var i = startIndex; i < endIndex; i++) {
                solar_pgArr.push(pageList[i].fd_pv_area_const);
                booster_pgArr.push(pageList[i].fd_elec_swit_const);
                outside_pgArr.push(pageList[i].fd_outside_const);
                total_pgArr.push(pageList[i].fd_total_proj_progress);
                console.log(pageList[i].fd_station_name);
                // if(pageList[i].fd_station_name.indexOf('MW') ==-1){
                //     buildString='--'
                // }else{
                //     buildString = pageList[i].fd_station_name.match(/\d+MW/ig)[0];
                // }
                // buildIndex = pageList[i].fd_station_name.indexOf(buildString);
                // xData.push(
                //     {
                //         value: pageList[i].fd_station_name.substring(0, buildIndex) + "\n" + buildString,
                //         textStyle: {
                //             //详见textStyle
                //             // color : 'red',
                //             // lineHeight:'30px'
                //         }
                //     }
                // );

                xData.push(
                    {
                        value: pageList[i].fd_station_name,
                        textStyle: {
                            //详见textStyle
                            // color : 'red',
                            // lineHeight:'30px'
                        }
                    }
                );

            }
            this.drawPowerPlanChart(dealEchartBarArr(solar_pgArr), dealEchartBarArr(booster_pgArr), dealEchartBarArr(outside_pgArr), dealEchartBarArr(total_pgArr), xData);


        },
        //绘制进度chart
        drawPowerPlanChart: function (solar_pgArr, booster_pgArr, outside_pgArr, total_pgArr, xData) {
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
                        var str = "<p align='left'>电站：" + data[0].name + "</p>";
                        for (var i = 0; i < data.length; i++) {
                            str += "<p align='left'>" + data[i].seriesName + "：" + dealEchartToolTip(data[i].value) + "%";
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
                    data: [LANG["1_1_actual_solarArea"], LANG["1_1_actual_offsideSpace"], LANG["1_1_actual_boosterStation"], LANG["1_1_actual_totalProgress"]]
                },
                // 网格
                grid: {
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
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
                                color: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei'
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        boundaryGap: [0, 0.01],
                        data: xData,
                        interval: 1
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: "%",
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
                        min: 0,
                        max: 100,
                        nameTextStyle: {
                            fontSize: 15,
                            fontFamily: 'Microsoft YaHei'
                        },
                        axisTick: axisTickObj
                    }
                ],
                series: [
                    {
                        name: LANG["1_1_actual_solarArea"],
                        type: 'bar',
                        yAxisIndex: 0,
                        barMaxWidth: 10,
                        itemStyle: {
                            normal: {
                                color: '#DFE895'
                            }
                        },
                        data: solar_pgArr
                    },
                    {
                        name: LANG["1_1_actual_offsideSpace"],
                        type: 'bar',
                        yAxisIndex: 0,
                        barMaxWidth: 10,
                        itemStyle: {
                            normal: {
                                color: '#F65D33'
                            }
                        },
                        data: booster_pgArr
                    },
                    {
                        name: LANG["1_1_actual_boosterStation"],
                        type: 'bar',
                        yAxisIndex: 0,
                        barMaxWidth: 10,
                        itemStyle: {
                            normal: {
                                color: '#0196DB'
                            }
                        },
                        data: outside_pgArr
                    },
                    {
                        name: LANG["1_1_actual_totalProgress"],
                        type: 'bar',
                        barMaxWidth: 10,
                        yAxisIndex: 0,
                        itemStyle: {
                            normal: {
                                color: '#2CE9FF'
                            }
                        },
                        data: total_pgArr
                    }
                ]

            };
            $('.loadingDiv').hide();
            var ptChart = echarts.init(document.getElementById('dxxsAll'));
            ptChart.setOption(option);
            $(".showm_bottom .loadingDiv").hide();
            $("#dxxsAll div").show();
        },
        //关闭弹窗
        closeWindow: function () {
            $(".M_bottom_b1", parent.document).removeClass("M_bottom_b1_clicked");
            window.parent.closeEqualHourFm();
        }
    },
    mounted: function () {

        this.getAllPlan();
    }
});
