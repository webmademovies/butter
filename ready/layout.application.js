

$(document).ready(function () { 

  var outerLayout, middleLayout, innerLayout; 

  outerLayout = $('body').layout({ 
    center__paneSelector: ".outer-center" 
  , west__paneSelector:   ".outer-west" 
  , east__paneSelector:   ".outer-east" 
  , west__size:       350 
 
  , spacing_open:     8 // ALL panes
  
  , north__spacing_open:  0
  , south__spacing_open:  0
  //, west__onresize:   "outerLayout.resizeAll" 
  , resizable: false
  , closable: false
  
  }); 

  
  middleLayout = $('div.outer-center').layout({ 
    center__paneSelector: ".middle-center" 
  
  , north__size:       395
  //, spacing_open:     8  // ALL panes
  //, spacing_closed:     12 // ALL panes
  //, center__onresize:   "innerLayout.resizeAll" 
  , resizable: false
  , closable: false
  }); 


}); 
