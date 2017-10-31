new Vue({
    el: '#stationBulding',
    data: {},
    methods: {
        //电站建设
        stationBuild: function () {
            var _this = this;
            var Parameters = {
                "parameters": {"stationid": "", "statusstr": ""},
                "foreEndType": 2,
                "code": "20000006"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                if (res.success) {
                    var newArr = res.data;
                    var newArr1 = [];
                    var newArr2 = [];
                    // newArr = vlm.Utils.sortArr(newArr,'fd_station_status');
                    for(var i=0;i<newArr.length; i++){
                        if (newArr[i].fd_sys_solut == '分布式'){
                            newArr1.push(newArr[i]);
                        }else{
                            newArr2.push(newArr[i]);
                        }
                    }

                    var newArr3=newArr1.concat(newArr2);

                    var stationStr = $('#stationTpl').html();
                    var trHtml = ejs.render(stationStr, {newArr: newArr3});
                    $("#tbody_id").html(trHtml);
                    $(".showm_table").mCustomScrollbar({});
                    $('.loadingDiv').hide();
                } else {
                    alert(res.message);
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
