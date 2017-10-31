new Vue({
    el: '#allPowerDialog',
    data: {
        curYearGen: {
            pageSize: 9,//每页显示条目数
            currentPage: 1, //当前页
            rowCount: 0,//总条目数
            pageCount: 0,//总页数
            dataArr: []//所有电站数据
        },
        items: []
    },
    methods: {
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
        //点击小图标tab
        changePage: function (e, index) {
            if (!$(e.target).hasClass('on')) {
                this.curYearGen.currentPage = index + 1;
                this.currentYearGenCurPage();
                this.showCurPage();
            }
        },
        currentYearGenAll: function () {
            var _this = this, startDateStr = vlm.Utils.currentYear();
            /*java接口测试 */
            $.ajax({
                url:vlm.serverAddr+'stationInfo/getFarmJz',
                type:'get',
                dataType:'json',
                traditional: true,
                data:{
                },
                success:function(res){
                    _this.curYearGen.dataArr = res.list;
                    var length = _this.curYearGen.dataArr.length;
                    _this.curYearGen.rowCount = length;
                    _this.curYearGen.pageCount = _this.curYearGen.rowCount / _this.curYearGen.pageSize;
                    var remainder = _this.curYearGen.rowCount % _this.curYearGen.pageSize;
                    if (remainder != 0) {
                        _this.curYearGen.pageCount = parseInt(_this.curYearGen.pageCount) + 1;
                    }
                    if (_this.curYearGen.pageCount > 1) {
                        _this.showPageantion();
                    }
                    _this.currentYearGenCurPage();
                },
                error:function(){},
            });
            /*var Parameters = {
                "parameters": {
                    "sorttype": "1",
                    "sort": 2,
                    "starttime": startDateStr,
                    "topn": "1000",
                    "stationid": "ALL"
                },
                "foreEndType": 2,
                "code": "20000008"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                _this.curYearGen.dataArr = res.data;
                console.log(_this.curYearGen.dataArr)
                var length = _this.curYearGen.dataArr.length;
                _this.curYearGen.rowCount = length;
                _this.curYearGen.pageCount = _this.curYearGen.rowCount / _this.curYearGen.pageSize;
                var remainder = _this.curYearGen.rowCount % _this.curYearGen.pageSize;
                if (remainder != 0) {
                    _this.curYearGen.pageCount = parseInt(_this.curYearGen.pageCount) + 1;
                }
                if (_this.curYearGen.pageCount > 1) {
                    _this.showPageantion();
                }
                _this.currentYearGenCurPage();
            });*/
        },
        //渲染当前页内容
        currentYearGenCurPage: function () {
            this.isPageArrowAvilable(); //判断左右两个大按钮active
            $(".loadingDiv").show();
            var startIndex = this.curYearGen.pageSize * (this.curYearGen.currentPage - 1);
            var endIndex = this.curYearGen.currentPage * this.curYearGen.pageSize;
            var trHtml = "", listArr = this.curYearGen.dataArr;
            var listStr = $('#allPowerList').html();
            trHtml = ejs.render(listStr, {listArr: listArr, startIndex: startIndex, endIndex: endIndex});
            $("#iconsUl").html(trHtml);
            $(".loadingDiv").hide();
        },

        //当前页选中效果
        showCurPage: function () {
            $("#pagenation li").removeClass("on");
            $("#pagenation li").eq(this.curYearGen.currentPage - 1).addClass("on");
        },
        //分页箭头可用
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
        //箭头分页
        arrowChangePage: function () {
            if (event.target == document.getElementById("left_max_btn") && this.curYearGen.currentPage > 1) {
                this.curYearGen.currentPage--;
            } else if (event.target == document.getElementById("right_max_btn")) {
                this.curYearGen.currentPage++;
            }
            this.currentYearGenCurPage();
            this.showCurPage();
            this.isPageArrowAvilable();
        },
        //关闭弹窗
        closeWindow: function () {
            $(".Monitor_left_c1_highLt", parent.document).removeClass("Monitor_left_c1_highLt");
            window.parent.closeEqualHourFm();
        }

    },
    mounted: function () {
        this.currentYearGenAll();
    }

})