

$(document).ready(function () { 

  var outerLayout, middleLayout; 

  outerLayout = $("body").layout({ 
    center__paneSelector: ".outer-center",  
    west__paneSelector:   ".outer-west",
    east__paneSelector:   ".outer-east",
    west__size:       430 ,
 
    spacing_open:     8, // ALL panes
  
    north__spacing_open:  0,
    south__spacing_open:  0,
    resizable: false,
    closable: false
  
  }); 

  
  middleLayout = $("div.outer-center").layout({ 
    center__paneSelector: ".middle-center", 
    north__size:       397, 
    resizable: false,
    closable: false
  }); 


}); 
