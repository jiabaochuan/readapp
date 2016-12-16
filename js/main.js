/**
 * Created by jiabaochuan on 2016/12/15.
 */
(function(){
    "use strict"
    var Util=(function(){//localStorage在同一个域名下共享，为了防止误操作将其封装。
        var prefix="html5_reader_";
        var StorageGetter=function(key){
            return localStorage.getItem(prefix+key);
        };
        var StorageSetter=function(key,val){
            return localStorage.setItem(prefix+key,val);
        };
        var getJSONP=function(url,callback){//插件封装好的JSONP方法
            return $.jsonp({
                url:url,
                cache:true,
                callback:"duokan_fiction_chapter",
                success:function(result){
                    var data= $.base64.decode(result);
                    var json=decodeURIComponent(escape(data));
                    callback(json);
                }
            })

        };
        return {
            getJSONP:getJSONP,
            StorageGetter:StorageGetter,
            StorageSetter:StorageSetter
        }
    })();
    var Dom={
        top_nav:$("#top-nav"),
        bottom_nav:$("#bottom-nav"),
        time_check:$("#night-button"),
        book_font:$("#book-font"),
        font_container:$(".font-container"),
        icon_ft:$("#icon-ft"),
        book_night:$("#book-night"),
        book_time:$("#book-time")
    };
    var colors=['#ffffff','#e9dfc7','#9c9c9c','#38B0DE','#3282cd'];

    var Win=$(window);
    var Doc=$(document);
    var body=$("body");
    var	RootContainer=$("#fiction_container");
    var i=0;//初始值
    var a=[];
    var readerModel;//ReaderModel()
    var readerUi;//ReaderBaseFrame()
    var initFontSize=Util.StorageGetter("font_size");//初始的字体大小
    initFontSize=parseInt(initFontSize);
    if(!initFontSize){
        initFontSize=14;
    }
    RootContainer.css("font-size",initFontSize);

    var color=Util.StorageGetter("background_color");//初始背景颜色
    if(!color){
        color="#e9dfc7"
    }
    body.css("background-color",color);

    function main(){//整个项目的接口函数
        readerModel=ReaderModel();
        readerUi=ReaderBaseFrame(RootContainer);
        readerModel.init(function(data){
            readerUi(data)
        });
        EventHanlder();
    }
    function ReaderModel(){//实现与阅读器相关的数据交互的方法
        var Chapter_id;
        var Chapter_all;//总共的章节数
        var init=function(UIcallback){
            getFictionInfo(function(){//获取章节信息
                getCurChapterContent(Chapter_id,function(data){
                    UIcallback&&UIcallback(data);
                })
            })
        };
        var getFictionInfo=function(callback){
            $.get("data/chapter.json",function(data){
                Chapter_id=Util.StorageGetter("last_chapter_id");
                if(!Chapter_id){
                    Chapter_id=data.chapters[1].chapter_id;
                }
                Chapter_all=data.chapters.length;//总共的章节数
                callback&&callback();
            },"json")
        };
        var getCurChapterContent=function(chapter_id,callback){//获得章节那日哦那个
            $.get("data/data"+chapter_id+".json",function(data){
                if(data.result==0){
                    var url=data.jsonp;
                    Util.getJSONP(url,function(data){
                        callback&&callback(data);
                    })
                }
            },"json")
        };
        var prevChapter=function(UIcallback){//上翻页
            Chapter_id=parseInt(Chapter_id,10);//章节id
            if(Chapter_id==0){//第一章无法上翻页
                return
            }
            Chapter_id-=1;//上一章id
            getCurChapterContent(Chapter_id,UIcallback);
            Util.StorageSetter("last_chapter_id",Chapter_id);
        };
        var nextChapter=function(UIcallback){//下翻页
            Chapter_id=parseInt(Chapter_id,10);
            if(Chapter_id==Chapter_all){//第一章无法上翻页
                return
            }
            Chapter_id+=1;//上一章id
            getCurChapterContent(Chapter_id,UIcallback);
            Util.StorageSetter("last_chapter_id",Chapter_id);
        };
        return {
            init:init,
            prevChapter:prevChapter,
            nextChapter:nextChapter
        }
    }


    function ReaderBaseFrame(container){//渲染基本的UI结构
        function parseChapterData(jsonData){
            var jsonObj=JSON.parse(jsonData);
            var html='<h4>'+jsonObj.t+"</h4>";
            for(var i=0;i<jsonObj.p.length;i++){
                html+="<p>"+jsonObj.p[i]+"</p>"
            }
            return html;
        }
        return function(data){
            container.html(parseChapterData(data))
        }
    }


    function EventHanlder(){//交互的时间绑定
        $("#action_mid").on("click",function(){
            if(Dom.top_nav.css("display")=="none"){
                Dom.top_nav.show();
                Dom.bottom_nav.show();
            }else {
                Dom.top_nav.hide();
                Dom.bottom_nav.hide();
                Dom.font_container.hide();
                Dom.icon_ft.addClass("icon-ft").removeClass("current");
            }
        });
        Dom.book_font.on("click",function(){//字体面板唤醒
            if(Dom.font_container.css("display")=="none"){
                Dom.font_container.show();
                Dom.icon_ft.removeClass("icon-ft").addClass("current");
            }else{
                Dom.font_container.hide();
                Dom.icon_ft.addClass("icon-ft").removeClass("current");
            }
        });
        Dom.time_check.on("click",function(){
            //触发背景切换
            if(Dom.book_night.css("display")=="none"){
                Dom.book_night.show();
                Dom.book_time.hide();
                body.css("background-color",colors[0]);
                Util.StorageSetter("background_color",colors[0]);
            }else{
                Dom.book_night.hide();
                Dom.book_time.show();
                body.css("background-color",colors[4]);
                Util.StorageSetter("background_color",colors[4]);
            }
        });
        $("#large-font").on("click",function(){//字体改变
            if(initFontSize>20){
                return;
            }else{
                initFontSize+=1;
                RootContainer.css("font-size",initFontSize);
            }
            Util.StorageSetter("font_size",initFontSize);//把数值存储起来
        });
        $("#small-font").on("click",function(){//字体改变
            if(initFontSize<12){
                return;
            }
            initFontSize-=1;
            RootContainer.css("font-size",initFontSize);
            Util.StorageSetter("font_size",initFontSize);
        });
        for(var i=0;i<5;i++){//闭包满足背景切换
            var a=i;
            (function(i){
                $("#bg-"+(i+1)).on("click",function(){
                    body.css("background-color",colors[i]);
                    Util.StorageSetter("background_color",colors[i]);
                })
            })(i);
        }
        Win.scroll(function(){//滚动消除
            Dom.top_nav.hide();
            Dom.bottom_nav.hide();
            Dom.font_container.hide();
            Dom.icon_ft.addClass("icon-ft").removeClass("current");
        });
        $("#prev_button").on("click",function(){//上翻页
            readerModel.prevChapter(function(data){
                readerUi(data);
            });
            window.scrollTo(0,0);
        });
        $("#next_button").on("click",function(){//下翻页
                readerModel.nextChapter(function(data){
                    readerUi(data);
                });
            window.scrollTo(0,0);
        });

    }
    main();
})();
