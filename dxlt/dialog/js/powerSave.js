new Vue({
    el: '#powerSave',
    data: {},
    methods: {
        //节能减排
        powerSave: function () {
            var _this = this;
            var Parameters = {
                "parameters": {
                    "topn": "1000",
                    "stationid": "ALL"
                },
                "foreEndType": 2,
                "code": "20000009"
            };
            vlm.loadJson("", JSON.stringify(Parameters), function (res) {
                if(res.success){
                    var newArr = res.data;
                    var saveStr = $('#powerSaveTpl').html();
                    var trHtml = ejs.render(saveStr, {newArr: newArr});
                    $("#tbody_id").html(trHtml);
                    $(".showm_table").mCustomScrollbar({});
                    $('.loadingDiv').hide();
                }else{
                    alert(res.message);
                }
            });

        },
        closeWindow: function () {
            $(".Mc5_bg_highLt", parent.document).removeClass("Mc5_bg_highLt");
            window.parent.closeEqualHourFm();
        }
    },
    mounted: function () {
        this.powerSave();
    }
});
