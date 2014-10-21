(function()
{
$('.carousel,.carousel ul').css('display','inline')

var siteUrl = 'http://www.eda.by/news/113.html';
var voteUpUrl = 'http://www.eda.by/enter.php';

function runForestRun(){
  var checkCountInterval = setInterval(function(){
    $.get(siteUrl,function(r){

    var omnomnomArray = $('.line-img');
      for(var i=0;i<omnomnomArray.length;i++){
      var el = omnomnomArray[i];     
      var title = $('p',el);
      var clickCountStr = $(title).text().split(' ');    
      var clickCount = clickCountStr[0];
      var maxCount = clickCountStr[2];
      if(clickCount==maxCount-1){
        console.log("Well, let's try...");
        var clickHref = $('a',el);
        var rId = parseInt($(clickHref).attr('rel'));
        $.post(voteUpUrl,{act : 'crazyg', r : rId},
               function(result){
                 var isWin = result.indexOf('кликов')==-1 && result.indexOf('Ожидайте')==-1
                 if(isWin){
                    var prize = $(clickHref).attr('onmouseover')+'';
                    var title = $(title).text();                   
                    console.log('You are awesome! You win : '+prize + result)
                 }
                 else
                 {
                   console.log('Эх, почти...почти.'+result);
                 }                 
               })
        
        window.clearInterval(checkCountInterval);        
        WaitTenMinAndRun();        
        return;
       }
      }     

});
  
  },1000)
}

function WaitTenMinAndRun(){
	//wait 10 min
    setTimeout(function() {    
    runForestRun();    
  }, 60 * 1000*10); 
}

runForestRun();

})();
