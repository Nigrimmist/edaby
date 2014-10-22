(function()
{
$('.carousel,.carousel ul').css({'display':'inline','position':'initial'})
$('body').prepend('<div id="closeToWin"></div>');
var siteUrl = 'http://www.eda.by/news/113.html';
var voteUpUrl = 'http://www.eda.by/enter.php';

function runForestRun(){
var closeToWinDiv = $('#closeToWin');
  var checkCountInterval = setInterval(function(){
    $.get(siteUrl,function(r){

    var omnomnomArray = $('.line-img');
	var itemsArr = [];
	
      for(var i=0;i<omnomnomArray.length;i++){
      var el = omnomnomArray[i];     
      var title = $('p',el);
	  var titleText = $(title).text();  
	  
	  if(titleText.indexOf('кликов')==-1 && titleText.indexOf('Ожидайте')==-1){
		log('warning. unexpected title'+titleText);
		return;
	  }
	  var clickCountStr = titleText.split(' ');    
      var clickCount = parseInt(clickCountStr[0]);
      var maxCount = parseInt(clickCountStr[2]);
	  
	  itemsArr.push({cur:clickCount,max:maxCount});
	  
      if(clickCount>=maxCount-4){
        log("Well, let's try...");
        var clickHref = $('a',el);
        var rId = parseInt($(clickHref).attr('rel'));
        $.post(voteUpUrl,{act : 'crazyg', r : rId},
               function(result){
                 var isWin = result.indexOf('кликов')==-1 && result.indexOf('Ожидайте')==-1;
				 var prize = $(clickHref).attr('onmouseover')+'';
                 
                 if(isWin){                                     
                    log('You are awesome! You win : '+prize + result + titleText)
                 }
                 else
                 {
                   log('Эх, почти...почти.'+prize+result+titleText);
                 }                 
               })
        
        window.clearInterval(checkCountInterval);        
        WaitTenMinAndRun();        
        return;
       }
      }     
	itemsArr.sort(function(a, b){
     return a.max-a.cur > b.max-b.cur ? 0 : 1;
	});
	var closesToWin = itemsArr.pop();
	$(closeToWinDiv).html('До ближайшего осталось : '+(closesToWin.max-closesToWin.cur)+' клика');
	
});
  
  },500)
}

function WaitTenMinAndRun(){
	//wait 10 min
    setTimeout(function() {    
    runForestRun();    
  }, 60*1000*10); 
}

function log(msg){
$('body').prepend(msg+'<br />')
}

runForestRun();

})();
