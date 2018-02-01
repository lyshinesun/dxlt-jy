new Vue({
    el: '#stationBulding',
    data: {},
    methods: {
        //电站建设
        stationBuild: function () {
            var _this = this;

            $.ajax({
                url:vlm.serverAddr+"tbstationbaseinfo/list",	//请求地址
                dataType: "json",
                type : "GET",
                traditional: true,//这里设置为true
                success:function(result){
                    if (result.code ==0) {
                        var newArr = result.page.list;
                        var stationStr = $('#stationTpl').html();
                        var trHtml = ejs.render(stationStr, {newArr: newArr});
                        $("#tbody_id").html(trHtml);
                        $(".showm_table").mCustomScrollbar({});
                        $('.loadingDiv').hide();
                    }
                }
            });

        },

        closeWindow: function () {
            $(".Monitor_right_c3", parent.document).removeClass("Monitor_right_c3_highLt");
            window.parent.closeEqualHourFm();
        }
    },
    mounted: function () {
        this.stationBuild();
    }
});
