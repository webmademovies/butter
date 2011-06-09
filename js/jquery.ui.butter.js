/*
 * Butter Track Widgter jquery.ui.butter.js
 * Version 0.1.0
 * 
 * Developed by Bocoup on behalf of the Mozilla Foundation
 * Copyright (c) 2011 Bocoup, LLC
 * Authors: Alistair McDonald
 * Dual licensed under the MIT and GPL licenses.
 * http://code.bocoup.com/license/
 *
 */

(function( global, document, jQuery, _, Popcorn ) {

  /*var auto    = 100,
      eResize = 101,
      wResize = 102,
      drag    = 103,

      mouseModes	= {
      	"auto" : 100,
				"e-resize" : 101, 
				"w-resize" : 102,
				"drag" : 103
      }, 
      
      trackCount = -1,
      
      lastMouseDown = {
        x: 0, 
        y: 0
      },
			range = function(start, stop, step) {
				var start = start || 0,
				    stop  = stop || start || 0,
				    step  = step || 1,
				    len   = Math.ceil( (stop - start) / step) || 0 ,
				    idx   = 0,
				    range = [];
				
				range.length = len;
				
				while ( idx < len ) {
				  range[ idx++ ] = start;
				  start += step;
				}
				return range;
			},
      styles = {
        trackEvent: {
          defaults: function( c, x, y, w, h ) {
            //  `x` seems to come up as NaN occassionally

            ////  // // console.log( c, x, y, w, h );
            ////  // // console.log(isNaN(x));
            if ( isNaN(x) ) {
              return;
            }      

            //document.body.style.cursor="e-resize";
            var grad = c.createLinearGradient(0,0,0,h);
            grad.addColorStop(0,"rgba( 255, 255, 0, 0.3 )");
            grad.addColorStop(1,"rgba( 255, 255, 0, 0.3 )");
            c.fillStyle = grad;

            c.fillRect(x, 1.5, w, h-1.5);

            c.fillStyle = "rgba(255,255,255,.125)";
            c.fillRect(x, 0, w, h/2);          
            c.lineWidth=0.5;
            c.fillStyle="#FF0";          
            c.fillRect(x, 3, 1, h-5);
            c.fillRect(x+w-1, 3, 1, h-5);

          },
          hover: function( c, x, y, w, h ) {
            //  `x` seems to come up as NaN occassionally
            if ( isNaN(x) ) {
              return;
            }      
            //document.body.style.cursor="move";
            c.fillStyle = "#FF0";
            c.fillRect(x, 1.5, w, h-1.5);          
            var grad = c.createLinearGradient(0,0,0,h);
            grad.addColorStop(0,"rgba(255,255,255,.7)");
            grad.addColorStop(1,"rgba(0,0,0,.25)");
            c.fillStyle = grad;
            c.fillRect(x,0, w, h);
            c.fillStyle="#FF0";
            c.fillRect(x, 0, 1, h);
            c.fillRect(x+w-1, 0, 1, h);
            c.fillRect(x, h-1.5, w, 2);
            c.fillRect(x, 0, w, 1);
          },
          thumb: {
            left: {
              defaults: function( c, x, y, w, h ) {
                c.fillStyle = "#880";
                c.fillRect(x, 0, 8, h);
                c.fillStyle = "#FF0";
                c.fillRect(x, 0, 1, h);
              }
            },
            right: {
              defaults: function( c, x, y, w, h ) {
                c.fillStyle = "#880";
                c.fillRect(x+w-9, 0, 8, h);
                c.fillStyle = "#FF0";
                c.fillRect(x+w-1, 0, 1, h);
              }
            }
          }
        },
        zoomEvent: {
          defaults: function( c, x, y, w, h ) {
            //document.body.style.cursor="e-resize";
            var grad = c.createLinearGradient(0,0,0,h);
            grad.addColorStop(0,"rgba( 128, 255, 0, 0.3 )");
            grad.addColorStop(1,"rgba( 128, 255, 0, 0.3 )");
            c.fillStyle = grad;
            c.fillRect(x, 1.5, w, h-1.5);
            c.fillStyle = "rgba(255,255,255,.125)";
            c.fillRect(x, 0, w, h/2);          
            c.lineWidth=0.5;
            c.fillStyle="#AF0";          
            c.fillRect(x, 3, 1, h-5);
            c.fillRect(x+w-1, 3, 1, h-5);

          },
          hover: function( c, x, y, w, h ) {
              //document.body.style.cursor="move";
              c.fillStyle = "#AF0";
              c.fillRect(x, 1.5, w, h-1.5);          
              var grad = c.createLinearGradient(0,0,0,h);
              grad.addColorStop(0,"rgba(128,255,0,.7)");
              grad.addColorStop(1,"rgba(0,0,0,.25)");
              c.fillStyle = grad;
              c.fillRect(x,0, w, h);
              c.fillStyle="#AF0";
              c.fillRect(x, 0, 1, h);
              c.fillRect(x+w-1, 0, 1, h);
              c.fillRect(x, h-1.5, w, 2);
              c.fillRect(x, 0, w, 1);
          },
          thumb: {
            left: {
              defaults: function( c, x, y, w, h ) {
                c.fillStyle = "#480";
                c.fillRect(x, 0, 16, h);
                c.fillStyle = "#AF0";
                c.fillRect(x, 0, 4, h);
              }
            },
            right: {
              defaults: function( c, x, y, w, h ) {
                c.fillStyle = "#480";
                c.fillRect(x+w-17, 0, 16, h);
                c.fillStyle = "#AF0";
                c.fillRect(x+w-4, 0, 4, h);
              }
            }
          }
        }   
      };      

  function TrackEvent( props, parent ) {
    
    ////  // // console.log("TrackEvent",props, this);
    
    jQuery.extend(this, props);

    //// // console.log( this );
    this.parent = parent;
    this.oxl = 0;
    this.oxr = 0;
    this.xl = 0;
    this.xr = 0;
    this.hovered = false;
    this.draw();
    
    return this;
  }

  TrackEvent.prototype.draw = function( thumbLeft, thumbRight ) {
    
    //e.pageX
		//// // console.log( thumbLeft, thumbRight );
    
    var x   = this.xl = this.oxl + (this.parent.width / this.parent.options.duration * this.inPoint),
        rw  = this.parent.width / this.parent.options.duration * (this.outPoint-this.inPoint),
        h   = this.parent.height,
        c   = this.parent.context,
        type;

		//this.xl += this.parent.element.offset().left;
		
		
    x = x * 100/this.parent.zoomWindow.width-(this.parent.zoomWindow.offsetX*100);
    rw = rw * 100/this.parent.zoomWindow.width;

    this.xr = x + rw;


		

    //var mouseX = this.parent.mouseX;         

    type = ( this.parent.options.mode === "smartZoom" ) ? "zoomEvent" : "trackEvent";
    
    
    if ( this.hovered ) {
    
      styles[type].hover( c, x, null, rw, h );
      
      if ( thumbLeft ) {
        styles[type].thumb.left.defaults( c, x, null, rw, h );
      }
      
      if ( thumbRight ) {
        styles[type].thumb.right.defaults( c, x, null, rw, h );
      }
      
    }else{
      styles[type].defaults( c, x, null, rw, h );
    }
    
  };


  jQuery.widget("butter.track", {

    options: {
    },

    _init: function( ) {
console.log("init called");

      this.index = trackCount++;

      // Contains any trackEvent that overlaps the current view window
      this._inView = [];

      this.hovering = null;

      this._loadedmetadata = function( e ) {
        this.options.duration = e.currentTarget.duration;
      };
    
      this._playBar = {
        position: 0
      };
    
      function newCanvas( w, h ) {
        var canvas, context;
        canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        context = canvas.getContext("2d");
        return context;
      }
      
      this.width = this.element.width();
      this.height = this.element.height();

      ////  // // console.log(this.width, this.height);
      jQuery.extend(this, {
        context     : newCanvas( this.width, this.height ),
        scrubBar    : { position: 0, width: 3 },
        mouse       : { x: 0, y:0, down: false, lastX:0, lastY:0, mode:auto },
        range				:	null,
        zoomWindow  : { offsetX:0, width:100 }
      });

      jQuery.extend(this.options, {
        style: {
          outerBar: {
            lineWidth: 1,
            strokeStyle: "#888"
          },
          playBar: {
            lineWidth: 1,
            strokeStyle: "#f00"
          }
        }
      });      
      
      

      if ( this.options.mode === "smartZoom" ) {
        this._inView.push(new TrackEvent({
          inPoint   : 0,
          outPoint  : 100,
          duration  : 100
        }, this ));
      }
      
      this.element.append( this.context.canvas );

      if ( this.options.target ) {
        this.options.target.bind( "timeupdate.track", jQuery.proxy( this._timeupdate, this ) );
        this.options.target.bind( "loadedmetadata.track", jQuery.proxy( this._loadedmetadata, this ) );
      }

      this.element.bind( "mousemove.track", jQuery.proxy( this._mousemove, this ) );
      this.element.bind( "mousedown.track mouseup.track", jQuery.proxy( this._mouseupdown, this ) );
      this.element.bind( "mouseenter.track mouseleave.track", jQuery.proxy( this._hover, this ) );
      
      this._draw();
      
      return this;
      
    },


    _style: function( styleObj ) {
      var prop;
    
      for ( prop in styleObj ) {
        this.context[prop] = styleObj[prop];
      }
    },
    
    
    killTrackEvent: function ( props ) {

      var ret = [];
      
      _.each( this._inView, function ( track, key ) {
        
        if ( track._id !== props._id ) {
          ret.push(track);
        }
        
      });
      
      
      this._inView  = ret;
    
    },
    
    addTrackEvent: function( props ) {
    
      return this._inView.push( new TrackEvent( props, this ) );
    },

    zoom: function( props ) {
      this.zoomWindow.offsetX = props.offsetX;
      this.zoomWindow.width = props.width;
      //this.options.duration = this.options.width;
      this._draw();
    },
   
    _draw: function( thumbLeft, thumbRight ) {
    
      ////  // // console.log( "_draw:thumbLeft, thumbRight", thumbLeft, thumbRight );
      
      jQuery(document).trigger("drawStart.track");
    
      var c = this.context,
          e = c.canvas,
          w = e.width,
          h = e.height,
          grad = c.createLinearGradient(0,0,0,h), 
          i = 0, 
          len = this._inView.length, 
          iv;
          
     //  //  // // console.log("_draw:len", len, this._inView );
      
      grad.addColorStop( 0,"#fff" );
      grad.addColorStop( 1,"#B6B6B6" );
      //grad.addColorStop(1,"#eee");
      
      
      c.fillStyle = grad;
      c.fillRect(0,0,w,h);

      c.strokeStyle = "#9D9D9D";
      c.lineWidth = 0;
      c.strokeRect(0.5,0.5,w-1,h-1);

      for( ; i < len; i++ ) {
        
        iv = this._inView[i];
        
        iv.draw( thumbLeft, thumbRight );
      }

      
      jQuery(document).trigger("drawComplete.track");
    },

    _timeupdate: function( e ) {
    
      ////  // // console.log("timeupdate");    
      this._playBar.position = e.currentTarget.currentTime;
      this._draw();
    },

    _mousemove: function( e ) {
      
      ////  // // console.log(e);
      
      e = e.originalEvent;
      
      this.mouse.lastX = this.mouse.x;
      this.mouse.lastY = this.mouse.y;
      
      
      //  // // console.log(global);
      
      var scrollX = (global.scrollX !== null && typeof global.scrollX !== "undefined") ? global.scrollX : global.pageXOffset, 
          scrollY = (global.scrollY !== null && typeof global.scrollY !== "undefined") ? global.scrollY : global.pageYOffset,
          thumbLeft, thumbRight, 
          i = 0, 
          len = this._inView.length, 
          iv, linkedTracks, j, diff, bounds;
      
      ////  // // console.log("this.element[0].offsetLeft", this.element[0].offsetLeft);
      ////  // // console.log("this.element[0]", this.element[0]);
      ////  // // console.log("this.element[0]", { elem: this.element[0].parentNode.scrollLeft });
      ////  // // console.log(e.clientX, e.clientY);
      ////  // // console.log(this.mouse.x);

			//			// // console.log("this.element[0]", {
			//				p: this.element[0].parentNode
			//			});

			//// // console.log( e.pageX );
      //this.mouse.x -= e.pageX;
      //this.mouse.y -= e.pageY;

			//// // console.log( this.mouse.x );


			//	STABLE MOUSE OVER POSITIONS
      this.mouse.x = e.clientX; // - this.element[0].offsetLeft + scrollX + this.element[0].parentNode.scrollLeft;
      this.mouse.y = e.clientY - this.element[0].offsetTop + scrollY;


      bounds = this.element[0].getBoundingClientRect();

			//	CORRECTION TO POSITION
			//this.mouse.x = this.mouse.x >= 0 && this.mouse.x || 1;


			//// // console.log( "this.element[0].getBoundingClientRect()",this.element[0].getBoundingClientRect() );
			//// // console.log( "this.mouse.x", this.mouse.x );


      //// // console.log( this.mouse.x, this.mouse.y );
      thumbLeft = thumbRight = false;

      if ( !this.mouse.down ) {

				// console.log( "!this.mouse.down, this.mouse.mode", this.mouse.mode );
        
        this.mouse.hovering = null;
        
        for( ; i < len; i++ ) {
          
          iv = this._inView[i];

          //iv.xl += this.element.offset().left;
          //iv.xr += this.element.offset().left;

          //iv.xl += bounds.left + this.element[0].parentNode.scrollLeft;
          //iv.xr += bounds.left + this.element[0].parentNode.scrollLeft;

					this.range = range( Math.floor(iv.xl) , Math.floor(iv.xr) );

          var mouseX = this.mouse.x - bounds.left;
          
          if ( iv.xl <= mouseX && iv.xr >= mouseX ) {
          //if ( this.range.indexOf( this.mouse.x ) != -1 ) {

						//// // console.log( "iv.xl <= this.mouse.x && iv.xr >= this.mouse.x", this.mouse.x, iv.xl , iv.xr );
          	
            if ( !iv.hovered ) {
              iv.hovered = true;
            }
            
            this.mouse.hovering = iv;

            this.mouse.hovering.grabX = this.mouse.x - this.mouse.hovering.xl + 1;
            
            if ( mouseX >= iv.xl && mouseX <= iv.xl + 8 ) {

              document.body.style.cursor="w-resize";
              thumbLeft = true;
              
            } else if ( mouseX >= iv.xr-8 && mouseX <= iv.xr ) {

              document.body.style.cursor="e-resize";
              thumbRight = true;

            } else {

              document.body.style.cursor="move";

            }
            
          } else {

            if ( iv.hovered ) {
              iv.hovered = false;
              this.mouse.hovering = null;
              this._draw();
            }

          }
        }
        if ( !this.mouse.hovering ) {
          this.mouse.mode = auto;
          document.body.style.cursor="auto";
          return;
        }
      }

			//// // console.log( "continue A to: this.mouse.down", this.mouse.down );
      
      iv = this.mouse.hovering;

      //iv.xl += this.element.offset().left;
      //iv.xr += this.element.offset().left;

      //iv.xl += bounds.left + this.element[0].parentNode.scrollLeft;


      if ( this.mouse.down ) {

	      //this.mouse.x -= bounds.left;

        if ( this.mouse.mode === auto && this.mouse.hovering ) {
          var xOffset = bounds.left;
          var leftSide = iv.xl + xOffset;
          var rightSide = iv.xr + xOffset;
          if ( this.mouse.x >= leftSide && this.mouse.x <= leftSide + 8 ) {
            this.mouse.mode = wResize;
          } else if ( this.mouse.x >= rightSide - 8 && this.mouse.x <= rightSide ) {
            this.mouse.mode = eResize;
          } else if ( this.mouse.x >= leftSide + 8 && this.mouse.x <= rightSide - 8 ) {
          
            ////  // // console.log("this.mouse.x", this.mouse.x);
            ////  // // console.log("iv", iv);
            ////  // // console.log("iv.xl", iv.xl);
            ////  // // console.log("dragset");
            
            this.mouse.mode = drag;
          }
        }
        
        thumbLeft = thumbRight = false;

				//this.mouse.mode = mouseModes[ document.body.style.cursor ];
        
        if ( [ eResize, wResize ].indexOf( mouseModes[ document.body.style.cursor ] ) > -1 ) {
          
          // // console.log("dragging handles");
          ////  // // console.log(this.mouse.hovering.xl, this.mouse.hovering.xr);
          
          var cancelDrag = false;
          
          if ( this.mouse.hovering.xl + 20 > this.mouse.hovering.xr ) {
          
            this.mouse.hovering.popcornEvent.start = this.mouse.hovering.inPoint - 2 ;  
            
            cancelDrag = true;
          }


          if ( this.mouse.hovering.xr - 20 < this.mouse.hovering.xl ) {

            this.mouse.hovering.popcornEvent.end = this.mouse.hovering.outPoint + 2 ;          
            
            cancelDrag = true;
          }

          
          if ( this.mouse.lastX  < this.mouse.hovering.xl && this.mouse.mode === 102 ) {
            cancelDrag = false;            
          }
          
          if ( this.mouse.lastX  > this.mouse.hovering.xr && this.mouse.mode === 101 ) {
            cancelDrag = false;    
          }


					// // console.log( "cancelDrag", cancelDrag );

          if ( cancelDrag ) {
            this._draw(thumbLeft, thumbRight);
            
            return;
          }

        }
        
				//// // console.log( "continue B to: this.mouse.down", this.mouse.down );
				//// // console.log( "continue to: this.mouse.mode ", this.mouse.mode );
        
        if ( this.mouse.mode === eResize ) {

					// // console.log( "eResize" );
        
          thumbRight = true;

          document.body.style.cursor="e-resize";

					// // console.log( this.mouse.x );
					
          this.mouse.hovering.outPoint = this.options.duration / this.width * (this.mouse.x+4-bounds.left);

          if ( this.options.mode !== "smartZoom" ) {

          	// // console.log( "!smartZoom: this.mouse.hovering.outPoint ", this.mouse.hovering.outPoint );
            this.mouse.hovering.popcornEvent.end = this.mouse.hovering.outPoint;

          } else {

            linkedTracks = this.options.linkedTracks;              
            
            for( j in linkedTracks ) {
            
              linkedTracks[j].track( "zoom", {
                offsetX: this.mouse.hovering.inPoint,
                width: this.mouse.hovering.outPoint - this.mouse.hovering.inPoint
              });
            }
          }
        } 


        if ( this.mouse.mode === wResize ) {

					// // console.log( "wResize" );
        
          thumbLeft = true;
          document.body.style.cursor="w-resize";
            this.mouse.hovering.inPoint = this.options.duration / this.width * (this.mouse.x-4-bounds.left);
            if ( this.options.mode !== "smartZoom" ) {
              this.mouse.hovering.popcornEvent.start = this.mouse.hovering.inPoint;
            } else {
              
              linkedTracks = this.options.linkedTracks;              
              
              for( j in linkedTracks ) {
                linkedTracks[j].track( "zoom", {
                  offsetX: this.mouse.hovering.inPoint,
                  width: this.mouse.hovering.outPoint - this.mouse.hovering.inPoint
                });
              }
            }
        }

        if ( this.mouse.mode === drag ) {

        	// console.log( "drag" );
          document.body.style.cursor="move";
          
          diff = this.mouse.hovering.outPoint - this.mouse.hovering.inPoint;
          
          var mouseX = this.mouse.x - this.mouse.hovering.grabX;

          this.mouse.hovering.inPoint = mouseX / this.width * this.options.duration;
          this.mouse.hovering.outPoint = this.mouse.hovering.inPoint + diff;
                   
          if ( this.options.mode !== "smartZoom" ) {
            
            this.mouse.hovering.popcornEvent.start = this.mouse.hovering.inPoint ;
            this.mouse.hovering.popcornEvent.end = this.mouse.hovering.outPoint ;
            
          } else {

            linkedTracks = this.options.linkedTracks;              
            
            for( j in linkedTracks ) {
              linkedTracks[j].track( "zoom", {
                offsetX: this.mouse.hovering.inPoint,
                width: this.mouse.hovering.outPoint - this.mouse.hovering.inPoint
              });
            }
            
          }
        }

      }

      ////  // // console.log( this.mouse.mode, this.mouse.hovering, this.mouse.down );

      this._draw(thumbLeft, thumbRight);

    },

    _mouseupdown: function( event ) {
      
     //  //  // // console.log( "_mouseupdown", event.type, event );
      
      if ( event.type === "mousedown" ) {
        
        this.mouse.down = true;
        
        $.extend( lastMouseDown, { x: event.pageX, y: event.pageY });

        return;
      }
      
      if ( event.type === "mouseup" ) {
      
        ////  // // console.log("mouseup");
        //this.mouse.mode = auto;

        this.mouse.mode = auto;
        
        if ( this.mouse.hovering && this.mouse.down ) {
          
          if ( this.options.mode !== "smartZoom" ) {
            
            ////  // // console.log("lastMouseDown", lastMouseDown, { x: event.pageX, y: event.pageY });
            
            //  If mouse hasnt moved, fire edit event (will open edit dialog)
            if ( lastMouseDown.x === event.pageX ) {
              
              this.mouse.hovering.editEvent( event );
              
            } else {
             
              //  Placeholder for future ondrag
              //this.mouse.hovering.editEvent( event );
              
            }
          }
          
          this.mouse.hovering = null;
        }
        this.mouse.down = false;
        this._draw();
      }
    },

    _hover: function( event ) {
      
    //  //  // // console.log( "_hover", event.type, event );
    
      if ( event.type === "mouseenter" ) {
        
        ////  // // console.log(event, this);
        
        this._draw();
        
        return;
      }
      
      if ( event.type === "mouseleave" ) {

        if ( this.mouse.hovering ) {
        
					//  //  // // console.log( "_hover:mouseleave", "this.mouse.hovering", this.mouse.hovering );
          this.mouse.hovering.hovered = false;
        }

        this.mouse.hovering = null;
        this.mouse.mode = auto;
        
        document.body.style.cursor="auto";
        
        this._draw();
      }
    }
  });*/


}( this, this.document, this.jQuery, this._, this.Popcorn ));

