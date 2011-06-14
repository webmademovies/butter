/*
 * Butter Application butter.application.js
 * Version 0.1.1
 *
 * Developed by Bocoup on behalf of the Mozilla Foundation
 * Authors: Rick Waldron, Alistair McDonald, Boaz Sender
 *
 */

(function( global, _ ) {

  //  Mixin any random, misc functions

  var parseFloat = global.parseFloat,
      parseInt = global.parseInt;


  _.mixin({
    //  Capitalize the first letter of the string
    capitalize : function( string ) {
      return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    },
    // Camel-cases a dashed string
    camel: function( string ) {
      return string.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace("-","");});
    },
    //  Create a slug string, ex: "This is a test" > "this-is-a-test"
    slug: function(str) {
      str ? str.toLowerCase().match(/[a-z0-9]+/ig).join("-") : str;
      return str;
    },
    //  Zero pads a number
    pad: function( number ) {
      return ( number < 10 ? "0" : "" ) + number;
    },
    fract: function( number, fract ) {
      return ( Math.round(number * fract) / fract );
    },
    //
    fourth: function( number ) {
      return _( number ).fract( 4 );
    },
    // Convert an SMPTE timestamp to seconds
    smpteToSeconds: function( smpte ) {
      var t = smpte.split(":");

      if ( t.length === 1 ) {
        return parseFloat( t[0], 10 );
      }

      if (t.length === 2) {
        return parseFloat( t[0], 10 ) + parseFloat( t[1] / 12, 10 );
      }

      if (t.length === 3) {
        return parseInt( t[0] * 60, 10 ) + parseFloat( t[1], 10 ) + parseFloat( t[2] / 12, 10 );
      }

      if (t.length === 4) {
        return parseInt( t[0] * 3600, 10 ) + parseInt( t[1] * 60, 10 ) + parseFloat( t[2], 10 ) + parseFloat( t[3] / 12, 10 );
      }
    },
    secondsToSMPTE: function( time ) {

      var timeStamp = new Date( 1970,0,1 ),
          seconds;

      timeStamp.setSeconds( time );

      seconds = timeStamp.toTimeString().substr( 0, 8 );

      if ( seconds > 86399 )  {

        seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);

      }
      return seconds;
    }
  });

})( window, _ );



(function( global, document, $, _, Popcorn ) {

  //  TrackStore: Storage object constructor
  //  TODO: refactor args from list to options object
  function TrackStore( title, desc, remote, theme, layout, autosave ) {

    this.title = title || null;
    this.description = desc || null;
    this.remote = remote || null;
    this.theme = theme || null;
    this.layout = layout || null;
    this.data = null;
    this.autosave = autosave || false;
    this.targets = null;
    this.tracks = null;

    return this;
  }

  TrackStore.properties = [ "title", "description", "remote", "theme", "layout", "autosave", "targets", "tracks" ];


  //  Property getter/setter factory
  _.each( TrackStore.properties, function( key ) {

    TrackStore.prototype[ _( key ).capitalize() ] = function( val ) {
      return ( !val && this[ key ] ) || ( this[ key ] = val );
    };

  });


  TrackStore.prototype.prepare = function( from ) {

    //  `from` references a {$p}.data.trackEvents.byStart object
    var ret = {},
        sizeof = _.size( from ),
        iter = 0;

    //  Serialize the string properties
    _.each( TrackStore.properties, function( key ) {

      ret[ key ] = this[ _( key ).capitalize() ]();

    }, this);


    //  Placeholder for the track event data
    ret.data = [];//{ foo: "bar" };


    //  Iterate current track event data
    _.each( from, function( key, val, i ) {

      //  Ignore the dummy events at begining and end
      if ( iter > 0 && iter < sizeof - 1 ) {

        var event = {},
            temp = {},
            plugin = key._natives.type,
            manifest = key._natives.manifest.options;


        _.each( key, function( prop, eventKey ) {

          //  ignore internally set properties
          if ( eventKey.indexOf("_") !== 0 && !!prop ) {

            temp[ eventKey ] = prop;

          }
          else if ( eventKey === '_id' ) {
          
            temp[ 'id' ] = prop;
          
          } //if

        });

        event[ plugin ] = temp;

        ret.data.push( event );

      }

      iter++;
    });

    //  Return prepared data as object
    return ret;
  };

  TrackStore.prototype.serialize = function( from ) {

    // stringify a prepared track event object
    return JSON.stringify( this.prepare( from ) );
  };

  TrackStore.prototype.slug = function() {
    return ( this.title || "" ).toLowerCase().match(/[a-z0-9]+/ig).join("-");
  };

  TrackStore.prototype.create = function( slug, from ) {

    //  If slug is not a string, shift the arguments
    //  !_.isString( slug ) && ( from = slug, slug = this.slug() );
    if ( !_.isString( slug ) ) {
      from = slug;
      slug = this.slug();
    }

    var prepared = this.prepare( from ),
        stored = TrackStore.getStorageAsObject( TrackStore.NS ),
        projects = {
          projects: {}
        },
        entry = {};


    //  Create new storage entry
    entry[ slug ] = prepared;


    //  Rebuild storage object
    _.extend( projects.projects, stored.projects, entry );


    localStorage.setItem(
      //  Namespace stored data
      TrackStore.NS,
      //  Stringified video and track data
      JSON.stringify( projects )
    );

    return {
      slug: slug,
      serial: JSON.stringify( prepared )
    };
  };

  TrackStore.prototype.read = function( slug ) {
    //var stored = TrackStore.getStorageAsObject();
    //  NOT IMPLEMENTED
    return false;
  };

  TrackStore.prototype.update = function( slug, from ) {
    return this.create( slug, from );
  };

  TrackStore.prototype.remove = function( slug, callback ) {

    var stored = TrackStore.getStorageAsObject();

    if( typeof stored.projects !== "undefined" ) {

      if ( stored.projects[ slug ] ) {

        delete stored.projects[ slug ];

      }
    }

    localStorage.setItem(
      //  Namespace stored data
      TrackStore.NS,
      //  Stringified video and track data
      JSON.stringify( stored )
    );


    callback && callback.call( null, stored );

  };

  //  Utility Functions
  TrackStore.deleteProject = function( id ) {




  };

  TrackStore.getStorageAsObject = function( prop ) {

    prop = prop || TrackStore.NS;

    if ( !prop ) {
      //throw msg;
      return false;
    }

    var storedStr = localStorage.getItem( prop ),
        storedObj = new Function( "return " + storedStr )();

    if ( !!storedStr ) {
      return storedObj || null;
    }

    return {};
  };

  TrackStore.getStorageByProperty = function( prop ) {

    var storage = TrackStore.getStorageAsObject( TrackStore.NS );

    return ( storage && storage[ prop ] ) || null;
  };

  TrackStore.NS = null;


  //  Expose TrackStore as a global constructor
  global.TrackStore = TrackStore;

})(window, document, $, _, Popcorn);



(function( global, document, $, _, Popcorn ) {

  function ObjectDatabase ( selectElement ) {

    var objects = {},
        numObjects = 0,
        that = this;

    // From Jason Bunting
    var replaceHTMLChars = (function() {

      var translate_re = /(\ |\<|\>|\#|\&)/g;
      var translate = {
        " "  : "&nbsp",
        "#"  : "&#35;", 
        "<"  : "&lt", 
        ">"  : "&gt",
        "&"  : "&amp",
        "\"" : "&quote",
        "'"  : "&#39;",
      };

      return function( s ) {

        return ( s.replace(translate_re, function(match, entity) { 

          return translate[entity]; 

        }) );

      }
    })(); //replaceHTMLChars

    this.add = function ( id, item ) {

      if ( !id  || id === '' ) {
        return;
      } //if

      var option;

      if ( !objects[ id ] ) {

        ++numObjects;
        option = document.createElement('option');

      }
      else {

        option = objects[ id ].option;

      } //if

      option.innerHTML = replaceHTMLChars( id );
      option.value = id;

      objects[ id ] = {
        option: option,
        value: item,
      };

      selectElement.appendChild( option );

    }; //add

    this.clear = function () {
      
      for ( var o in objects ) {
        selectElement.removeChild( objects[o].option );
        delete objects[o];
      } //for

    }; //clear

    this.clone = function ( objects ) {
    
      for ( var o in objects ) {

        that.add( o, {} );

      } //for

    }; //clone

    this.getObjects = function () {

      return objects;

    }; //getObjects

    this.getValue = function ( id ) {

      if ( objects[ id ]) {

        return objects[ id ].value;

      } //if

      return undefined;

    };

    this.getOptionElement = function ( id ) {

      if ( objects[ id ]) {

        return objects[ id ].option;

      } //if

      return undefined;

    };

    this.remove = function ( id ) {

      if ( objects[ id ] ) {

        --numObjects;
        selectElement.removeChild( objects[ id ].option );
        delete objects[ id ];

      } //if

    }; //remove

    this.length = function () {
      return numObjects;
    }; //length

  } //ObjectDatabase

  global.ObjectDatabase = ObjectDatabase;

})(window, document, $, _, Popcorn);



(function( global, document, $, _, Popcorn ) {

  //  Random key=>val/method maps

  //  TODO: refactor for reusability.
  //  Setup data store
  if ( !localStorage.getItem( "Butter" ) ) {
    //console.log("reset");
    //  Initialize Butter storage
    localStorage.setItem( "Butter", "" );
  }

  //  Initialize TrackStore.NS (namespace)
  TrackStore.NS = "Butter";



  var formatMaps = {

    currentTime: function( time ) {


      var mm  = (""+ Math.round(time*100)/100 ).split(".")[1],
          ss  = ( mm || "" );

      // this is awful.
      if ( ss.length === 1 ) {
        ss = ss + "0";
      }
      // this is awful.
      if ( !ss ) {
        ss = "00";
      }

      return  _( Math.floor( time / 3600 ) ).pad() + ":" +
                _( Math.floor( time / 60 ) ).pad() + ":" +
                  _( Math.floor( time % 60 ) ).pad() + ":" +
                    ( ss === "0" ? "00" : ss );
    },

    mp4: 'video/mp4; codecs="avc1, mp4a"',
    ogv: 'video/ogg; codecs="theora, vorbis"',
    mov: 'video/mp4',
    m4v: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',

    accepts: [ ".ogv", ".mp4", ".mov", ".webm", ".m4v" ]
  },

  //  Cached global methods
  setInterval = global.setInterval,
  setTimeout = global.setTimeout,
  clearInterval = global.clearInterval,
  clearTimeout = global.clearTimeout;


  //  DOM ready block
  $(function() {

    var $popcorn,
        $trackLiner = new TrackLiner({
          element: "ui-tracklines",
          dynamicTrackCreation: true
        }),
        $doc = $(document),
        $win = $(global),
        $body = $("body"),

        $video = $("video"),
        $source = $("source"),

        $pluginSelectList = $("#ui-plugin-select-list"),
        $editor = $("#ui-track-event-editor"),

        $trackeditting = $("#ui-track-editting"),
        $trackstage = $trackeditting.parent(),
        $uitracks = $("#ui-tracks"),
        $tracktime = $("#ui-tracks-time"),
        $scrubberHandle = $("#ui-scrubber-handle"),
        $scrubber = $("#ui-scrubber,#ui-scrubber-handle"),

        $menucontrols = $(".ui-menu-controls"), // change to id?
        $videocontrols = $("#ui-video-controls"),

        $themelist = $("#ui-theme"),
        $layoutlist = $("#ui-layout"),
        $exporttolist = $("#ui-export-to"),
        $importtolist = $("#ui-import-to"),

        //  io- prefix ids map to inputs elements
        $ioCurrentTime = $("#io-current-time"),
        $ioVideoUrl = $("#io-video-url"),
        $ioVideoTitle = $("#io-video-title"),
        $ioVideoDesc = $("#io-video-description"),
        $ioVideoData = $("#io-video-data"),

        //  -ready suffix class has 2 matching elements
        $loadready = $(".ui-load-ready"),


        //
        $uiLoadingHtml = $("#ui-loading-html"),
        $uiLoadingOrigMsg = $uiLoadingHtml.find("p").text(),


        $uiStartScreen = $("#ui-start-screen"),
        $helpBtn = $("#help-btn"),
        $deleteBtn = $("#prjDelete"),
        $uiApplicationMsg = $("#ui-application-error"),

        trackMouseState = "mouseup",

        selectedEvent = null,
        lastSelectedEvent = null,
        activeTracks = {},
        trackStore,


        // Modules
        TrackEditor,
        TrackMeta,
        //TrackEvents,
        TrackExport,

        tempVideoUrl = "",

        // Autosaving
        autosaveInterval = -1,
        autosaveEnabled = true, 
        AUTOSAVE_INTERVAL = 30000,

        // Targets/Objects
        $uiTargetDatabase = $("#ui-target-database"),
        $uiTargetDatabaseList = $("#ui-target-database-list"),
        targetDatabase = new ObjectDatabase( $uiTargetDatabaseList[ 0 ] ),

        openDialogs = 0,

        // track editing
        manifestElems = {},
        outsidePopcornTrack,

        tracklinerTracks = {};

    global.$trackLiner = $trackLiner;

    var addTrackEvent = function( options, track ) {

      // use options.type, but support older options.id
      options.type = options.type || options.id;
      delete options.id;
      var track = track || $trackLiner.getTrack( "trackLiner0" ) || $trackLiner.createTrack();

      track.createTrackEvent( "butterapp", options );
    };

    function showEventPreview ( trackEvent ) {

      $("#ui-trackTitle-div").html("<h2>" + trackEvent.target + "</h2>");

      $(".ui-plugin-pane").each( function() {

        if( this.id !== trackEvent.target ) {
          $( document.getElementById( this.id ).parentNode ).hide();
        }
        else {
          $( document.getElementById( this.id ).parentNode ).show();
        } //if

      });

    } //showEventPreview

    // creates targetable display div if one doesn't exist
    var enforceTarget = function( plugin ) {

      if ( !$("#" + plugin + "-container").length ) {

        $("#ui-panel-preview").append("<li><div data-plugin="+ plugin +" id='"+ plugin +"-container' style='height: 255px;'></div></li>");
        $("#"+ plugin +"-container").addClass("ui-widget-content ui-plugin-pane").parent().resizable();
      }
    };

    $trackLiner.plugin( "butterapp", {
      // called when a new track is created
      setup: function( track, options, event, ui ) {

        if ( !tracklinerTracks[ track.id() ] ) {
          tracklinerTracks[ track.id() ] = track;
        } //if

        if ( ui ) {

          enforceTarget( ui.draggable[ 0 ].id );

          var start = _( options.left / document.getElementById( "ui-tracklines" ).offsetWidth * $popcorn.duration() ).fourth(),
              end = start + 2,
              // force div to display on a fourth of a second
              width = ( end - start ) / $popcorn.duration() * track.getElement().offsetWidth,
              left = start / $popcorn.duration() * track.getElement().offsetWidth;

              popcornDefaults = {
                // may need manifest help here
                start: start,
                end: end,
                target: ui.draggable[ 0 ].id + "-container"
              },

              defaults = PLUGIN_DEFAULTS[ ui.draggable[ 0 ].id ];

          if ( defaults ) {

            for ( var i in defaults ) {

              if ( defaults.hasOwnProperty(i) ) {
  
                popcornDefaults[i] = defaults[i];

              } //if

            } //for

          } //if

          var popcornTrack = $popcorn.getTrackEvent( options.id ) || $popcorn[ ui.draggable[ 0 ].id ]( popcornDefaults ).getTrackEvent( $popcorn.getLastTrackEventId() );

          showEventPreview( popcornTrack );
          $popcorn.media.currentTime += 0.0001;

          return { left: left, innerHTML: ui.draggable[ 0 ].id, width: width, id: popcornTrack._id };
        } else {

          enforceTarget( options.type );

          var start = options.start,
              end = options.end,
              // force div to display on a fourth of a second
              width = ( end - start ) / $popcorn.duration() * track.getElement().offsetWidth,
              left = start / $popcorn.duration() * track.getElement().offsetWidth,
              popcornTrack = $popcorn[ options.type ](options).getTrackEvent( $popcorn.getLastTrackEventId() );

          showEventPreview( popcornTrack );
          $popcorn.media.currentTime += 0.0001;

          return { left: left, innerHTML: options.type, width: width, id: popcornTrack._id };
        }
      },
      // called when an existing track is moved
      moved: function( track, trackEventObj, event, ui ) {

        var popcornTrack = $popcorn.getTrackEvent( trackEventObj.pluginOptions.id ),
            manifest = popcornTrack._natives.manifest,
            options = manifest.options,
            trackType = popcornTrack._natives.type,
            rebuiltEvent = {},
            prop;

        // copy over old properties into new
        // we only care to modify start and end
        for ( prop in options ) {

          if ( typeof options[ prop ] === "object" ) {

            rebuiltEvent[ prop ] = popcornTrack[ prop ];
          }
        }

        rebuiltEvent.target = trackType + "-container";

        // modify start and end based on div's new position
        rebuiltEvent.start = _( trackEventObj.element.offsetLeft / document.getElementById( "ui-tracklines" ).offsetWidth * $popcorn.duration() ).fourth();
        rebuiltEvent.end = _( ( trackEventObj.element.offsetLeft + trackEventObj.element.offsetWidth ) / document.getElementById( "ui-tracklines" ).offsetWidth * $popcorn.duration() ).fourth();

        // force new div to display on a fourth of a second
        trackEventObj.element.style.left = rebuiltEvent.start / $popcorn.duration() * track.getElement().offsetWidth + "px";
        trackEventObj.element.style.width = ( rebuiltEvent.end - rebuiltEvent.start ) / $popcorn.duration() * track.getElement().offsetWidth + "px";

        $popcorn.removeTrackEvent( popcornTrack._id );
        $popcorn[ trackType ]( rebuiltEvent );

        // dialog box is open on this track, update times
        if ( outsidePopcornTrack && outsidePopcornTrack._id === popcornTrack._id ) {

          manifestElems[ "end" ] && manifestElems[ "end" ].val( rebuiltEvent.end );
          manifestElems[ "start" ] && manifestElems[ "start" ].val( rebuiltEvent.start );

          outsidePopcornTrack = popcornTrack = $popcorn.getTrackEvent( $popcorn.getLastTrackEventId() );
        } else {

          popcornTrack = $popcorn.getTrackEvent( $popcorn.getLastTrackEventId() );
        }

        trackEventObj.pluginOptions.id = popcornTrack._id;
        $popcorn.media.currentTime += 0.0001;
      },
      // called when a track event is clicked
      click: function ( track, trackEventObj, event, ui ) {

        var popcornTrack = $popcorn.getTrackEvent( trackEventObj.pluginOptions.id );
        showEventPreview( popcornTrack );       

      },
      // called when a track event is double clicked
      dblclick: function( track, trackEventObj, event, ui ) {

        // create and reset reference to popcorn track currently open
        outsidePopcornTrack = $popcorn.getTrackEvent( trackEventObj.pluginOptions.id );

        // clear any references to dialog form elements
        manifestElems = {};

        var manifest = outsidePopcornTrack._natives.manifest,
            options = manifest.options,
            trackType = outsidePopcornTrack._natives.type,
            rebuiltEvent = {},
            label,
            prop,
            $targetSelectElem = $( "<select/>" );

        // function to rebuild event with data in form fields
        // function is dependant to this scope
        var rebuildEvent = function() {

          var rebuiltEvent = {},
              _val;

          $popcorn.removeTrackEvent( outsidePopcornTrack._id );
          var removedTrack = track.removeTrackEvent( trackEventObj.element.id );

          // modify manifest only attributes via matching form fields
          for( prop in manifest.options ) {
            if ( typeof manifest.options[ prop ] === "object" ) {

              _val = manifestElems[ prop ].val();

              rebuiltEvent[ prop ] = _val

              if ( !!_val && [ "start", "end" ].indexOf(prop) === -1 && !isNaN( _val )  ) {
                rebuiltEvent[ prop ] = +_val;
              }
            }
          }

          //if ( $targetSelectElem.val() !== "[no target]" ) {

            rebuiltEvent.target = trackType + "-container";
          //} else {

          //  rebuiltEvent.target = undefined;
          //}

          $popcorn[ trackType ]( rebuiltEvent );
          outsidePopcornTrack = $popcorn.getTrackEvent( $popcorn.getLastTrackEventId() );

          if ( $targetSelectElem.val() !== "[no target]" ) {

            outsidePopcornTrack['target-object'] = $targetSelectElem.val();
          } else {

            outsidePopcornTrack['target-object'] = undefined;
          }

          removedTrack.pluginOptions.id = outsidePopcornTrack._id;
          track.addTrackEvent( removedTrack );

          removedTrack.element.style.left = outsidePopcornTrack.start / $popcorn.duration() * track.getElement().offsetWidth + "px";
          removedTrack.element.style.width = ( outsidePopcornTrack.end - outsidePopcornTrack.start ) / $popcorn.duration() * track.getElement().offsetWidth + "px";

          $popcorn.media.currentTime += 0.0001;
        };

        // create the form field dialog for track editing
        // use $editor.dialog("open"); to open it
        $editor.dialog({
          autoOpen: false,
          title: "Edit " + _( trackType ).capitalize(),
          buttons: {
            "Delete": function() {

              $doc.trigger( "applicationNotice", {

                message: 'Are you sure you want to remove this Track Event? <br><br> <hr class="space">' +
                          "This action is permanent and cannot be undone.", 

                callback: function () {

                  //  Remove the track when user selects "ok"
                  $popcorn.removeTrackEvent( outsidePopcornTrack._id );

                  track.removeTrackEvent( trackEventObj.element.id );
                  $editor.dialog("close");
                  outsidePopcornTrack = null;
                }
              });
            },
            "Cancel": function() {

              $editor.dialog("close");
              outsidePopcornTrack = null;
            },
            "OK" : function() {

              rebuildEvent();
              $editor.dialog("close");
              outsidePopcornTrack = null;
            },
            "Apply" : function() {

              rebuildEvent();
            }
          }
        });

        // draw track form in dialog
        $("#ui-track-event-editor").children("*").remove();

        for ( prop in options ) {

          if ( typeof options[ prop ] === "object" && prop !== "target-object" ) {

            var opt = options[ prop ],
                elemType = opt.elem,
                elemLabel = opt.label,
                elem;

            elem = $( "<" + elemType + "/>", {
                      className: "text"
                    });

            manifestElems[ prop ] = elem;

            label = $("<label/>").attr("for", elemLabel).text(elemLabel);

            if ( elemType === "input" ) {

              var rounded = outsidePopcornTrack[ prop ];

              //  Round displayed times to nearest quarter of a second
              if ( _.isNumber( +rounded ) && [ "start", "end" ].indexOf( prop ) > -1 ) {

                rounded = _( +rounded ).fourth();
              }

              elem.val( rounded );
            }

            if ( elemType === "select" ) {

              _.each( opt.options, function( type ) {

                $( "<option/>", {
                  value: type,
                  text: _( type ).capitalize()
                }).appendTo( elem );
              });
            }

            elem.appendTo(label);
            label.appendTo( "#ui-track-event-editor" );
          } //if


        } //for

        label = $( "<label/>" ).attr( "for", "target" ).text( "Target" );
        var $option = $( "<option/>", {
            value: undefined,
            text: "[no target]",
          });
        $option.appendTo( $targetSelectElem );
        _.each( targetDatabase.getObjects(), function( target, id ) {

          var $option = $( "<option/>", {
            value: id,
            text: target.option.innerHTML,
          });

          $option[0].selected = id === outsidePopcornTrack[ 'target-object' ];
          $option.appendTo( $targetSelectElem );

        });
        
        $targetSelectElem.appendTo(label);
        outsidePopcornTrack[ 'target-object' ] && ($targetSelectElem[0].value = outsidePopcornTrack[ 'target-object ']);
        label.appendTo( "#ui-track-event-editor" );

        // open the form field
        $editor.dialog("open");
      }
    });

    $uiTargetDatabase.dialog( {

      autoOpen: false,
      modal: true,
      width: 400,
      height: 500,
      title: "Target Database",
      buttons: {

        "Close": function ( event, ui ) {
          $("#ui-target-database-add-input").val('');
          $(this).dialog( "close" );
        },

     },

    } );

    $("#ui-target-database-add").click( function ( event, ui ) {

      var val = $("#ui-target-database-add-input").val();

      if ( val === '' ) {

        $("#ui-application-error").html("<div><b>Error:</b> Target names can not be blank.</div>");
        $uiApplicationMsg.dialog({
          title: "Input Error",
          buttons: { "Ok": function () {
            $uiApplicationMsg.dialog( "close" );
          }}
        });

        return;

      }
      else {

        targetDatabase.add( val, {} );
        $("#ui-target-database-add-input").val('');

      } //if
      
    } );

    $("#ui-target-database-remove").click( function ( event, ui ) {

      targetDatabase.remove( $uiTargetDatabaseList.val() );

    } );
    


    $("#ui-menu-targets").click( function ( event ) {

      $uiTargetDatabase.dialog("open");

    } );

    
    $doc.bind("dialogopen dialogclose", function ( event ) {
      if ( event.type === "dialogopen" ) {
        ++openDialogs;
      }
      else {
        if ( openDialogs > 0 ) { 
          --openDialogs;
        }
      }
    });


    $win.bind("keydown", function ( event ) {
      if ( event.which === 32 && openDialogs === 0 ) {
        var name = event.target.tagName.toLowerCase();
        if ( name !== "button" && name !== "textarea" && name !== "input") {
          if ( $popcorn.video.paused ) {
            $popcorn.play();
          }
          else {
            $popcorn.pause();
          }
        }
      }
    });

    //  Handle beforeload events to prevent leaving accidentally
    $win.bind("beforeunload", function( event ) {
      return "Are you sure you want to leave Butter?";
    });

    //  Prevent Backspace and Delete keys from doing anything
    //  when the target is not an <input> or a <textarea> to
    //  prevent leaving accidentally.
    $win.keypress( function( event ) {
      var elem = event.srcElement || event.target;
      if ( (event.which === 46 || event.which === 8) &&
           (elem.nodeName !== "INPUT" && elem.nodeName !== "TEXTAREA") ) {
        event.preventDefault();
      }
    });

    //  Start with overlay scenes hidden
    $loadready.hide();

    //  Decorate UI buttons
    $("button,.ui-menu-controls").button();

    //  Render menusets ( create with: button + ul )
    $(".ui-menuset").each( function() {

      //  Find sibling ul to create menu pane
      $(this)
        .next("ul")
          .menu({
            select: function(event, ui) {
              $(this).hide();
            },
            input: $(this)
          })
          .css({
            position: "absolute",
            zIndex: 999
          })
          .hide();

    }).bind( "click", function() {

      var $menu = $(this).next("ul");


      $(".ui-menuset ~ ul").hide();


      if ( $menu.is(":visible") ) {
        $menu.hide();

        return false;
      }

      $menu.menu("deactivate").show().css({top:0, left:0 }).position({
        my: "left top",
        at: "left bottom",
        of: this
      });

      $doc.one( "click", function() {
        $menu.hide();
      });

      return false;

    });


    //  Cache body dimensions
    $body.dims = {
      width: $body.width(),
      height: $body.height()
    };


    //  Varying width listener
    $win.bind( "load resize", function () {

      $body.dims = {
        width: $body.width(),
        height: $body.height()
      };

      //  Set placement of loading icon
      $uiLoadingHtml.css({
        left: ( $body.dims.width / 2 ) - 64,
        top: ( $body.dims.height / 2 ) - 120,
        width: 130
      });

      //  Hide & Set Menu Position
      $(".ui-menuset ~ ul").hide().css({
        top:0, left:0
      });

      //  Set track area widths
      var stageWidth = $trackstage.width() - 10;

      $("#ui-track-editting, #ui-tracks, #ui-panel-preview").width(
        stageWidth
      );

      var $uiPanelPlugins = $("#ui-panel-plugins"),
          outerWest = $(".outer-west").height(),
          heightDiff = $("#ui-panel-video").height();

      $uiPanelPlugins
        .height( outerWest - heightDiff )
          .css("margin-top", "5px");

      $(".ui-command-panel div")
        .height(
          outerWest - heightDiff - ( 50 )
        );

      //  Set Scrubber Height
      TrackEditor.setScrubberHeight();

    });


    //   TrackMeta Module - define

    TrackMeta   = ( function() {

      return {

        project: {

          unload: function() {


            //  unload the project
            //  NOT IMPLEMENTED


          },

          load: function( tracks, project, preserve ) {

            //console.log(project);

            var trackEventMap = project.tracks;

            if ( !preserve ) {
              targetDatabase.clear();
              $trackLiner.clear();
              tracklinerTracks = {};
            } //if

            targetDatabase.clone( project.targets );

            if ( trackEventMap ) {

              for ( var trackName in trackEventMap ) {

                if ( !tracklinerTracks[ trackName ] ) {

                  var track = $trackLiner.createTrack( trackName );
                  tracklinerTracks[ trackName ] = track;
                } //if

              } //for

            } //if

            $ioVideoUrl.val( project.remote );

            $layoutlist
                .children()
                .removeClass( "active" )
                .each( function( index, elem ) {
                  var $elem = $( elem );
                  if ( $elem.text().replace(/\s/g, "").toLowerCase() === project.layout ){
                    $elem.addClass( "active" );
                    $layoutlist.attr( "data-layout", project.layout );
                  }
                });

            $themelist
              .children()
              .removeClass( "active" )
              .each( function( index, elem ) {
                var $elem = $( elem );
                if ( $elem.text().replace(/\s/g, "").toLowerCase() === project.theme ){
                  $elem.addClass( "active" );
                  $themelist.attr( "data-theme", project.theme );
                }
              });

            TrackEditor.loadVideoFromUrl( function () {

              if ( autosaveInterval === -1 ) {
                autosaveInterval = setInterval(controls.autosave, AUTOSAVE_INTERVAL);
              }

              if ( project.autosave ) {
                autosaveEnabled = false;
                $("#ui-application-error").html("<div><b>Warning:</b> Since you have opened an Autosave project, the Autosave feature is disabled until you save this project manually.</div>");
                $uiApplicationMsg.dialog({
                  title: "Autosave Disabled",
                  buttons: { "Ok": function () {
                    $uiApplicationMsg.dialog( "close" );
                  }}
                });
              }

              TrackMeta.project.loadWorkspace( tracks, trackEventMap );

              //  Load meta data
              $ioVideoTitle.val( project.title );
              $ioVideoDesc.val( project.description );

            });
          },

          loadWorkspace: function( tracks, trackEventMap ) {

            _.each( tracks, function( trackDataObj ) {

              _.each( trackDataObj, function( data, key ) {

                var options = _.extend( {}, { type: key }, data );

                var track;
                if ( trackEventMap && options.id ) {

                  for ( var trackName in trackEventMap ) {

                    var trackMap = trackEventMap[ trackName ];
                    if ( trackMap.indexOf( options.id ) > -1 ) {
                      console.log( trackMap, trackName, options.id, !!tracklinerTracks[ trackName ] );
                      track = tracklinerTracks[ trackName ] || $trackLiner.createTrack();
                      break;
                    } //if

                  } //for

                } //if

                addTrackEvent( options, track );

              });

            });

          }


        },

        menu: {

          unload: function( selector ) {

            var $list = $( selector + " li");

            if ( $list.length ) {
              $list.remove();
            }
          },

          load: function( selector ) {

            //  Unload current menu state
            this.unload( selector );

            var stored = TrackStore.getStorageAsObject( TrackStore.NS ),
                projects = stored.projects || false,
                $li;


            if ( projects ) {

              _.each( projects, function( data, prop ) {

                $li = $("<li/>", {


                  html: '<h4><img class="icon" src="img/dummy.png">' + data.title + "</h4>",
                  className: "select-li clickable", 
                  "data-slug" : prop

                }).appendTo( selector );


                //  Store track and project data for later access
                $li.data( "track",  data.data );
                $li.data( "project",  data );

              });

            } else {

              $li = $("<li/>", {
                html: '<h4><em class="quiet">You have no saved movies</em></h4>'
              }).appendTo( selector );

            }
          }
        }
      };

    })();


    //  Allow TrackMeta to be globally accessible
    global.TrackMeta = TrackMeta;

    
    //  Load the workspace menu
    TrackMeta.menu.load( "#ui-user-videos" );


    //  Load the start screen menu - #8043415
    TrackMeta.menu.load( "#ui-start-screen-list" );


    //  TrackEditor Module - organizes all track event editting logic
  
    TrackEditor = ( function(global) {
      
      return {

        timeLineWidth: 0,
        increment: 0,
        isScrubbing: false,
        inProgress: false,

        videoReady: function( $p, callback ) {

          //  Create an interval to check the readyState of the video
          var onReadyInterval = setInterval(function() {

            // console.log($p.video.readyState);

            //  readyState has been satisfied,
            //  4 is preferrable, but FF reports 3
            //  Firefox gotcha: ready does not mean it knows the duration
            //if ( $p.video.readyState >= 3 && !isNaN( $p.video.duration )  ) {
            if( $ioVideoUrl.val() === "baseplayer"  ){
              callback && callback();

              //  Allows other unrelated parts of the
              //  application to react when a video is ready
              $doc.trigger( "videoReady" );
              $doc.trigger( "videoLoadComplete" );

              //  clear the interval
              clearInterval( onReadyInterval );
            }
            else if ( $p.video.readyState >= 2 && !isNaN( $p.video.duration )  ) {
              $p.pause();
            //console.log("$p.video.readyState >= 2 && $p.video.duration", $p.video.duration);

              //  execute callback if one was given
              callback && callback();

              //  Allows other unrelated parts of the
              //  application to react when a video is ready
              $doc.trigger( "videoReady" );
              $doc.trigger( "videoLoadComplete" );

              //  clear the interval
              clearInterval( onReadyInterval );
            }

          }, 13);
        },

        timeLineReady: function( $p, callback ) {

          var onReady = _.bind( function() {

          //console.log( "this.drawTimeLine( $p.video.duration )");


            //  When ready, draw the timeline
            this.drawTimeLine( $p.video.duration );
            //  execute callback if one was given
            callback && callback();

            $doc.trigger( "timelineReady" );

          }, this);

          //  Ensure the video timeline is ready
          this.videoReady( $p,  onReady );
        },

        unload: {

          video: function() {

            var $v = $("video");


            //  Remove previously created video sources
            if ( $v.length ) {
              $v.remove();
            }

            if( $ioVideoUrl.val().search(/youtube/i) <= 0 && $ioVideoUrl.val().search(/vimeo/i) <= 0 && $ioVideoUrl.val().search(/soundcloud/i) <= 0 && $ioVideoUrl.val() != "baseplayer" ){

              $video = $( "<video/>", {

                id: "video"

              }).prependTo( "#video-div" );

            }

          },

          workspace: function() {

          },

          timescale: function() {

            TrackEditor.deleteCanvas( "ui-tracks-time", "ui-tracks-time-canvas" );
          }
        },

        loadVideoFromUrl: function( callback ) {

          document.getElementById("video-div").innerHTML = " ";
          $doc.trigger( "videoLoadStart" );


          var url = $ioVideoUrl.val(),
              tokens = url.split("."),
              type = tokens[ tokens.length - 1 ],
              self = this,



              //  Ready state
              netReadyInt,
              timelineReadyFn;


          tempVideoUrl = $ioVideoUrl.val();
          this.unload.video();

          if( url === "baseplayer" ) {

            $popcorn = Popcorn ( Popcorn.baseplayer() );
            $popcorn._resource = document.getElementById('video-div');

            setTimeout( function () {

              self.timeLineReady( $popcorn, timelineReadyFn );

            }, 13);
          }
          else if( url.search(/youtube/i) >= 0 || url.search(/vimeo/i) >= 0 || url.search(/soundcloud/i) >= 0 ) {
            if( url.search(/youtube/i) >= 0 ){
              $popcorn = Popcorn( Popcorn.youtube( 'video-div', url, { width: 430, height: 300 } ) );
              $popcorn.play();
            }
            else if( url.search(/vimeo/i) >= 0 ){
              $popcorn = Popcorn( Popcorn.vimeo( "video-div", url, {
                css: {
                  width: "430px",
                  height: "300px"
                }
              }));
              $popcorn.play();
            }
            else if( url.search(/soundcloud/i) >= 0 ){
              $popcorn = Popcorn( Popcorn.soundcloud( "video-div", url) );
              $popcorn.play();
            }
            setTimeout( function () {

              self.timeLineReady( $popcorn, timelineReadyFn );

            }, 13);
          }
          else {

            //  Create a new source element and append to the video element
            $source = $("<source/>", {

              //type: formatMaps[ type ],
              src: url

            }).prependTo( "#video" );

            //  Store the new Popcorn object in the cache reference
            $popcorn = Popcorn("#video");

            netReadyInt = setInterval( function () {

              //  Firefox is an idiot
              if ( $popcorn.video.currentSrc === url ) {

                self.timeLineReady( $popcorn, timelineReadyFn );
                clearInterval( netReadyInt );

              }

            }, 13);
          }

          //  When new video and timeline are ready
          timelineReadyFn = function() {

            global.$popcorn = $popcorn;

            //  Store refs to timeline canvas
            var $tracktimecanvas = $("#ui-tracks-time-canvas"),
                $prevTracks = $(".track"),
                $plugins = $(".ui-plugin-pane"),
                $uiTrackDiv = $("#ui-track-div"),
                trackLineDiv = document.getElementById( "ui-tracklines" ),
                increment = Math.round( $tracktimecanvas.width() / $popcorn.video.duration );

            // this line can be removed if the length of the canvas dictates the length of the container
            trackLineDiv.style.width = $tracktimecanvas.width() + "px";

            $ioVideoTitle.val("");
            $ioVideoDesc.val("");

            //  Empty active track cache
            if ( _.size( activeTracks ) ) {
              activeTracks = {};
            }


            //  Check for existing tracks and remove them, do not use cached reference
            if ( $prevTracks.length ) {
              $prevTracks.remove();
            }


            //  Check for existing elements inside the plugin panes
            if ( $uiTrackDiv.children().length ) {
              $uiTrackDiv.children().each( function () {
                $(this).remove();
              });
            } //if
            
            /*
            if ( $plugins.children().length ) {
              //$plugins.children().remove();
              console.log('REMOVING', $plugins.parent()[0].id);
              $plugins.parent().remove();
            }
            */

            //  Destroy scrubber draggable
            $scrubberHandle.draggable("destroy");

            (function() {
              //storing pause/play state when scrubber is dragged
              var wasPaused = false;
              
              //  Create scrubber draggable
              $scrubberHandle.draggable({

                scroll: true,
                scrollSensitivity: 50,
                scrollSpeed: 200,


                axis: "x",
                containment: "#ui-track-editting",

                grid: [ increment / 8, 0 ],
                //distance: increment / 4 / 2,
                start: function() {
                  TrackEditor.isScrubbing = true;
                  if ( !$popcorn.media.paused ) {
                    $popcorn.media.pause();
                    wasPaused = true;
                  }
                },
                stop: function() {
                  TrackEditor.isScrubbing = false;
                  if (wasPaused) { 
                    $popcorn.media.play();
                    wasPaused = false;
                  }                  
                },
                drag: function( event, ui ) {
                !$popcorn.media.paused && $popcorn.media.pause();

                  //console.log( ui, ui.offset.left );
                  var scrubPosition = ui.position.left  - $tracktimecanvas.position().left,
                      updateTo = $popcorn.video.duration / $tracktimecanvas.innerWidth() * scrubPosition,
                      quarterTime = _( updateTo ).fourth();

                  //  Force the time to be in quarters of a second
                  $popcorn.video.currentTime = quarterTime;

                }
              });
            })()

            $popcorn.video.currentTime = 0;

            TrackEditor.moveScrubberToPosition( 0 );

            //  Listen on timeupdates
            $popcorn.listen( "timeupdate", function( event ) {
              //  Updates the currenttime display
              $ioCurrentTime.val(function() {
                
                var $this = $(this),
                    prop = _( this.id.replace("io-", "") ).camel(),
                    val = $popcorn[ prop ]();

                return  formatMaps[ prop ]( _(val).fourth() ) ;

              });

              if ( $popcorn.video.currentTime >= 0 ) {

                //  Update the scrubber handle position
                var quarterTime = _( $popcorn.video.currentTime ).fourth(),
                //  Create ready state check interval
                isReadyInterval = setInterval(function() {

                  //console.log( "$tracktimecanvas.position().left", $tracktimecanvas.position().left);
                  //console.log("$uitracks.position().left", $uitracks.position().left);

                  var horizIncrement = ( $uitracks.innerWidth() / 4 );


                  //if ( $popcorn.video.readyState >= 3 ) {
                  if ( $popcorn.video.readyState >= 2 ) {

                    //console.log( increment, quarterTime, $tracktimecanvas.position().left + 2 );
                    //console.log( ( increment * quarterTime ) + $tracktimecanvas.position().left + 2 );
                    //console.log( "loading", $tracktimecanvas.position().left, quarterTime, ( increment * quarterTime ) + $tracktimecanvas.position().left + 2 );
                    //console.log( "quarterTime", quarterTime);

                    self.setScrubberPosition(
                      //( increment * quarterTime ) + $tracktimecanvas.position().left + 2,
                      ( increment * quarterTime ) + $tracktimecanvas.position().left + 1,
                      {
                        increments: increment,
                        current: quarterTime
                      }
                    );

                    //console.log(increment, quarterTime, Math.round( $uitracks.width() / 2 ));
                    //  #8402231
                    if ( $popcorn.video.paused === false && trackMouseState === "mouseup" && ( $scrubberHandle.position().left < 0 || $scrubberHandle.position().left + quarterTime >= $uitracks.innerWidth() ) ) {
                    //if ( $scrubberHandle.position().left > $uitracks.position().left + Math.round( horizIncrement * 3 ) ) {

                      //$uitracks.scrollLeft( $tracktimecanvas.innerWidth() ); //stable

                      //$uitracks.scrollLeft(
                      //  $uitracks.scrollLeft() + 30
                      //);


                      if ( !$("#ui-tracks:animated").length ) {

                        //$uitracks.stop();

                        //  This needs improvement
                        $uitracks.animate({

                          //scrollLeft: "+=" + Math.round( $tracktimecanvas.innerWidth() / 8 )
                          scrollLeft: $tracktimecanvas.innerWidth()/$popcorn.video.duration*$popcorn.video.currentTime

                        }, "slow", function () {

                          quarterTime = Math.ceil( quarterTime );

                          self.setScrubberPosition(
                            ( increment * quarterTime ) + $tracktimecanvas.position().left + 1,
                            //( increment * quarterTime ) + $tracktimecanvas.position().left + 2,
                            {
                              increments: increment,
                              current: quarterTime
                            }
                          );
                        }); // 600
                      }
                    }

                    TrackEditor.inProgress = false;
                    clearInterval( isReadyInterval );
                  }

                }, 1 );

              }

              $doc.trigger( "seekComplete", {
                type: "update",
                time: quarterTime,
                increment: increment,
                special: function () {
                 //console.log("special function");
                }
              });

            });

            //  Trigger timeupdate to initialize the current time disp lay
            $popcorn.trigger( "timeupdate" );

            //  If a callback was provided, fire now
            callback && callback();

          };

        },

        isScrubberWithin: function( trackEvent ) {

          var realLeft = ( $scrubberHandle.position().left - $trackeditting.position().left ) - 1,
              sIncrement = TrackEditor.increment * 4,
              posInTime = realLeft / sIncrement;


          return ( posInTime >= trackEvent.start &&
                    posInTime <= trackEvent.end );

        },

        setScrubberHeight: function( height ) {

          $scrubber.css({
            height: height || ( $trackeditting.height() - 20 )
          });

        },

        setScrubberPosition: function( position, state ) {

          var offset = 1,
              fixPosition;


          //  Throttle scrubber position update
          if ( !this.isScrubbing ) {

            //  Update the scrubber handle position
            fixPosition = Math.ceil(

              position + offset

            );


            TrackEditor.moveScrubberToPosition( fixPosition );

          }
        },

        moveScrubberToPosition: function( moveTo ) {
          
          //console.log( moveTo, $popcorn.video.currentTime );

          if ( moveTo === $("#ui-tracks-time").position().left ) {

            $scrubberHandle.css({
              left: moveTo //position - offset
            });

          } else {

            //  Stepping
            $scrubberHandle.css({
              left: moveTo //position - offset
            });

            //  Smooth Animation - CHOKES IN FIREFOX
            //$scrubberHandle.animate({
            //  left: moveTo
            //}, "fast");
          }
        },

        deleteCanvas: function( parent, id ) {

          //  TODO: change to jQuery API
          var canvas = document.getElementById(id);

          if ( canvas ) {
            document.getElementById(parent).removeChild( canvas );
          }

        },

        drawCanvas: function( parent, id, width, height ) {

          //  TODO: change to jQuery API
          var canvas = document.createElement("canvas");

          canvas.id = id;
          canvas.width = width;
          canvas.height = height;

          document.getElementById(parent).appendChild(canvas);

          //console.log(canvas);

          return canvas;
        },

        drawTimeLine: function( duration ) {


          //TrackEditor.timeLineWidth = Math.ceil( Math.ceil( duration ) / 30 ) * 800;
          //TrackEditor.timeLineWidth = Math.ceil( Math.ceil( duration ) / 30 ) * 1600;

          TrackEditor.timeLineWidth = Math.ceil( Math.ceil( duration ) / 30 ) * 1600;

          if ( TrackEditor.timeLineWidth > 32767 ) {

            TrackEditor.timeLineWidth = 32767;

          }


        //console.log("TrackEditor.timeLineWidth", TrackEditor.timeLineWidth);


          this.deleteCanvas( "ui-tracks-time", "ui-tracks-time-canvas" );
          this.drawCanvas( "ui-tracks-time", "ui-tracks-time-canvas", TrackEditor.timeLineWidth, 25 );


          var context = document.getElementById("ui-tracks-time-canvas").getContext("2d"),
              tick = TrackEditor.timeLineWidth / duration,
              durationCeil = Math.ceil(duration),
              durationRange = durationCeil * 2,

              increment = tick/4,
              offset = 2,
              primary = 0,
              secondary = 0,
              seconds = 0,
              posOffset;

          TrackEditor.increment = increment;

          context.font = "10px monospace";
          context.fillStyle = "#000";
          context.lineWidth = 1;

          //console.log("durationRange", durationRange);
          //console.log("tick", tick);

          for ( ; primary < durationRange; primary++ ) {

            //if ( primary >= 10 ) {
            offset = 25;
            //}

            context.lineWidth = 1;
            context.beginPath();

            if ( primary % 2 || primary === 0 ) {

              seconds++;

              if ( seconds <= durationCeil ) {

                context.fillText( _( seconds ).secondsToSMPTE() , seconds * tick - offset, 9 );

                //console.log(_( seconds ).secondsToSMPTE());
              }


              posOffset = primary * tick / 2;


              //  Secondary ticks
              for ( secondary = 0; secondary < 4; secondary++ ) {

                context.moveTo( posOffset + ( secondary * increment ), 20 );
                context.lineTo( posOffset + ( secondary * increment ), 25 );

              }


            } else {


              // Primary ticks
              context.moveTo( primary * tick / 2, 10 );
              context.lineTo( primary * tick / 2, 25 );

            }

            context.stroke();

          }
        }
      };


    })(global);

    //   TrackExport Module

    TrackExport = (function (global) {

      return {

        typemap: {

          "code" : "textarea",
          "project" : "textarea",
          "preview" : "iframe",
          "embeddable" : "textarea",
          "full" : "textarea"

        },
        exports: function( options ) {

          this.render[ this.typemap[ options.type ] ](
            options.parent,
            options.content
          );

        },
        render: {

          iframe: function( $parent, compiled ) {

            var $iframe = $("<iframe/>", { id: "ui-preview-rendered" }).width("100%").height($parent.height()-100),
                iframe, iframeDoc;

            $parent.html( $iframe );

            iframe = $("#ui-preview-rendered")[0];
            iframeDoc = ( iframe.contentWindow ) ?
                          iframe.contentWindow :
                          ( iframe.contentDocument.document ) ?
                            iframe.contentDocument.document :
                              iframe.contentDocument;

            iframeDoc.document.open();
            iframeDoc.document.write(compiled);
            iframeDoc.document.close();

          },
          textarea: function ( $parent, compiled ) {

            var $textarea = $("<textarea/>", { id: "ui-preview-rendered" }).width($parent.width()-100).height($parent.height()-100);

            $textarea.val( compiled );

            $parent.empty();
            $parent.append( $textarea );

          }
        }
      };

    })(global);




    var seekTo = 0,
    volumeTo = 0,
    controls = {

      autosave: function() {
        if ( autosaveEnabled && openDialogs === 0 ) {

          var name = $ioVideoTitle.val() + "-Autosave";
          controls.save(name);

        } //if
      },

      load: function() {
        var videoUri = $ioVideoUrl.val(),
            raccepts = /(.ogv)|(.mp4)|(.webm)|(.mov)|(.m4v)/gi;

        try {
          seekTo = 0;
          volumeTo = 0;


          targetDatabase.clear();
          tracklinerTracks = {};
          $trackLiner.clear();

          //  If no remote url given, stop immediately
          //if ( !videoUri || !raccepts.test( videoUri ) ) {
          if ( !videoUri ) {

            $doc.trigger( "applicationError", {
              type: !raccepts.test( videoUri ) ? "Invalid Movie Url" : "No Video Loaded",
              message: "Please provide a valid movie url. ("+ formatMaps.accepts.join(", ") +") "
            });

            return;
          }

          //  TODO: really validate urls

          document.getElementById( "ui-tracklines" ).innerHTML = "";
          $trackLine = new TrackLiner({
            element: "ui-tracklines",
            dynamicTrackCreation: true
          });
          //  If all passes, continue to load a movie from
          //  a specified URL.
          TrackEditor.loadVideoFromUrl(function() {
            audosaveIndex = 0;
            if ( autosaveInterval === -1 ) {
              autosaveInterval = setInterval(controls.autosave, AUTOSAVE_INTERVAL);
            }
          });
        }
        catch (err) {

          $doc.trigger( "videoLoadComplete" ); 

          if ( /file/.test( location.protocol ) && ( videoUri.search(/youtube/i) >= 0 || videoUri.search(/vimeo/i) >= 0 || videoUri.search(/soundcloud/i) >= 0 ) ) {

            $doc.trigger( "applicationError", {
              type: "Video needs to be run from a web server",
              message: "Youtube, Vimeo and SoundCloud support is only available if Butter is being run from a webserver."
            });

          }
          else {              
            $doc.trigger( "applicationError", {
              type: "URL Error",
              message: "Please check your url"
            });
          }   
        }
      },

      import: function() {

        var $textArea = $("<textarea/>");

        function doImport() {

          var blob = JSON.parse($textArea.val());

          TrackMeta.project.load( blob.data.data, blob );
          $doc.data( "current", {
            tracks: blob.data.data,
            project: blob
          });

        }

        var $div = $("#ui-user-input");

        var $form = $("<form/>");
        var $fieldset = $("<fieldset/>");
        $fieldset.append('<label>Butter Project Source:</label>');
        $fieldset.append($textArea);
        $form.append($fieldset);
        $div.append($form);

        $div.dialog({

          model: true,
          width: 500,
          height: 450,
          autoOpen: true,
          title: "Import Butter Project",

          beforeClose: function() {
            $("#ui-user-input").empty();
          },

          buttons: {

           "Close": function() {
              $(this).dialog( "close" );
            },

            "Ok": function() {
              $(this).dialog( "close" );
              doImport();
            },
 
          }
        });

      },

      remove: function() {

        var store = new TrackStore(),
            title = $ioVideoTitle.val(),
            slug = _( title ).slug();

        store.remove( slug, function () {


          //  Reload the menu
          TrackMeta.menu.load( "#ui-user-videos" );


          controls.load();

        });




      },
      save: function( autosaveTitle ) {
 
        autosaveTitle = autosaveTitle || false;

        var store = new TrackStore(),
            title = autosaveTitle || $ioVideoTitle.val(),
            desc = $ioVideoDesc.val(),
            remote = $ioVideoUrl.val(),
            theme = $themelist.attr( "data-theme" ),
            layout = $layoutlist.attr( "data-layout" ),
            slug;

        !title ? title = "Butter " + new Date() : title;

        slug = _( title ).slug();

        var tracks = {};
        _.each( tracklinerTracks, function( track, key, i ) {
          
          var trackEvents = track.getTrackEvents(),
              trackIds = []; 

          _.each( trackEvents, function ( trackEvent, trackEventKey, idx ) {

            trackIds.push(trackEvent.pluginOptions.id);

          });

          tracks[track.getElement().id] = trackIds;

        }); //each

        store.Title( title );
        store.Description( desc );
        store.Remote( remote );
        store.Theme( theme );
        store.Layout( layout );
        store.Autosave( autosaveTitle );
        store.Targets( targetDatabase.getObjects() );
        store.Tracks( tracks );


        //  Removed the if statement and creation of slug as we will always have a title now
        store.update( slug, $popcorn.data.trackEvents.byStart );

        //targetDatabase.clear();
        //$trackLiner.clear();
        //tracklinerTracks = {};

        //  Reload/update menu
        TrackMeta.menu.load( "#ui-user-videos" );


        if ( !autosaveTitle ) {
          //  Reload/update project -> [secretrobotron: we don't... really need to do this...]
        /*
          $("#ui-user-videos li[data-slug='"+ slug +"']").trigger( "click", {

            special: "Saving your project"

          });
        */

          autosaveEnabled = true;

        }

        trackStore = store;

      },

      play: function() {

        $popcorn.video.play();
      },

      pause: function() {

        $popcorn.video.pause();
      },

      volume: function( option ) {


        if ( option === "up" ) {
          volumeTo = $popcorn.video.volume + 0.1;
        }

        if ( option === "down" ) {
          volumeTo = $popcorn.video.volume - 0.1;
        }

        $popcorn.video.volume = volumeTo;

      },
      seek: function( option ) {

        if ( option.indexOf(":") > -1 ) {

          var $input = $("#" + ( option.split(":")[1] || "" ) );

          seekTo = _( $input.val() ).smpteToSeconds();
        }

        //  TODO: DRY out

        if ( option === "first" ) {
          seekTo = 0;

          $doc.trigger("seeked", "first");
        }

        if ( option === "prev" ) {

          seekTo = _($popcorn.video.currentTime - 0.25).fourth();

          $doc.trigger("seeked", "prev");
        }

        if ( option === "next" ) {

          seekTo = _($popcorn.video.currentTime + 0.25).fourth();

          $doc.trigger("seeked", "next");
        }

        if ( option === "last" ) {
          seekTo = $popcorn.video.duration;

          $doc.trigger("seeked", "last");
        }


        if ( seekTo > $popcorn.video.duration ) {
          seekTo = $popcorn.video.duration;
        }

        if ( seekTo < 0 ) {
          seekTo = 0;
        }


        //  Update current time
        $popcorn.video.currentTime = seekTo;


        //  Watch for readiness
        var isReadyInterval = setInterval(function() {

          //if ( $popcorn.video.readyState >= 3 ) {
          if ( $popcorn.video.readyState >= 2 ) {

            $doc.trigger( "seekComplete", {
              type: option,
              time: seekTo
            });

            clearInterval( isReadyInterval );
          }

        }, 1);

      }
    };


    //  UI Logic


    $uiStartScreen.dialog({
      modal: true,
      autoOpen: true,
      width: 400,
      height: 435,
      open: function() {

        var $this = $(this),
            value = $this.children( "input" ).val();


        $this.children("input").trigger("focus");

          $doc.one( "keydown", function( event ) {

            if ( event.which === 13 ) {

              $this.dialog( "close" );

              $ioVideoUrl.val( value );

              controls[ "load" ]();

            }

          });




      },
      buttons: {
        "Start": function() {
          var $this = $(this),
              value = $this.children( "input" ).val();
          var webServer = document.createElement( "div" );
          
          if ( /file/.test( location.protocol ) && ( value.search(/youtube/i) >= 0 || value.search(/vimeo/i) >= 0 || value.search(/soundcloud/i) >= 0 ) ) {

            $doc.trigger( "applicationError", {
              type: "Video needs to be run from a web server",
              message: "Youtube, Vimeo and SoundCloud support is only available if Butter is being run from a webserver."
            });

           } else {

            
            try {
              $ioVideoUrl.val( value );
              controls[ "load" ]();
              $this.dialog( "close" );
            } catch (err){
              $doc.trigger( "videoReady" );
              $doc.trigger( "videoLoadComplete" ); 
              $uiStartScreen.dialog( "open" ); 

              $doc.trigger( "applicationError", {
                type: "URL Error",
                message: "Please check your url"
              });
            }
            
          }
        }
      }
    });


    $editor.tabs();
    $editor.css({display:"none"});


    var PLUGIN_BLACKLIST = ['twitter', 'googlefeed', 'attribution', 'facebook', 'linkedin', 'gml', 'flickr', 'googlenews', 'tagthisperson', 'lastfm', 'openmap', 'mustache', 'lowerthird'];
    var PLUGIN_DEFAULTS = {

      wikipedia: {
        
        src: 'http://en.wikipedia.org/wiki/Mozilla',
        lang: 'en',

      },
      code: {

        onStart: function() {},
        onEnd: function() {},
        onFrame: function() {}
      
      }

    };

    //  Load plugins to ui-plugin-select-list
    _.each( Popcorn.registry, function( plugin, v ) {
      // TODO: convert to templates

      // adhere to blacklist
      if ( PLUGIN_BLACKLIST.indexOf(plugin.type) === -1 ) {

        var $li = $("<li/>", {

          id: plugin.type,
          className: "span-4 select-li clickable",
          html: "<h3><img class='icon' src='img/" + plugin.type.split(/\s/)[0].toLowerCase() + ".png'> " + _( plugin.type ).capitalize() + "</h3>",
          "data-trackliner-type": "butterapp"

        }).appendTo( "#ui-plugin-select-list" )
        .draggable({ helper: "clone", appendTo: "body", zIndex: 9001, revert: true, revertDuration: 0 });
      }

    });

    //  TODO: DRYOUT LAYOUT/THEME MENU BUILDING CODE

    //  Render layout menu
    $.getJSON("layouts/layouts.json", function( response ){
      _.each( response.layouts, function ( key ) {
        var type = key.replace(/\s/g, "").toLowerCase(), 
        $li = $("<li/>", {
          html: '<h4><img class="icon" src="img/dummy.png">' + key + "</h4>",
          className: "select-li clickable" + ( $layoutlist.attr( "data-layout" ) === type ? " active" : "")
        }).appendTo( $layoutlist );
        $li.data( "type",  type );
      });
    });

    //  Render theme menu
    $.getJSON("themes/themes.json", function( response ){
      _.each( response.themes, function ( key ) {
        var type = key.replace(/\s/g, "").toLowerCase(), 
				$li = $("<li/>", {
          html: '<h4><img class="icon" src="img/dummy.png">' + key + "</h4>",
          className: "select-li clickable" + ( $themelist.attr( "data-theme" ) === type ? " active" : "")
        }).appendTo( $themelist );
        $li.data( "type",  type );
      });
    });

    (function () {

      var oldProjectDetails,
          oldTitle,
          oldUrl;

      $( "#prj-details" ).click( function () {

        $( "#prjDiv" ).dialog ( {

          modal: true,
          title: "Project Details",
          autoOpen: true,
          width: 400,
          height: 435,

          open: function () {
            oldProjectDetails = $ioVideoDesc.val();
            oldTitle = $ioVideoTitle.val();
            oldUrl = $ioVideoUrl.val();
          },

          buttons: {
  
            "Close": function() {
              $( this ).dialog( "close" );
              $ioVideoUrl.val( oldUrl );
              $ioVideoDesc.val( oldProjectDetails );
              $ioVideoTitle.val( oldTitle );
            }
  
          } //buttons

        }); //dialog

      }); //click

      //  Close dialog when the save button is clicked
      $( "#prjSave" ).click( function () {
      
        if ( $ioVideoUrl.val() && $ioVideoTitle.val() ) {

          $( "#prjDiv" ).dialog ( "close" );

        }
        else {

          $doc.trigger( "applicationError", {
            type: "Save Error",
            message: "Your project requires a title and video url."
          });

        } //if

      });
    })();

    //  Render Import menu
    _.each( [ "Universal Subtitles", "Project" ], function ( key ) {
      var type = key.split(/\s/)[0].toLowerCase(),
      $li = $("<li/>", {

        html: '<h4><img class="icon" src="img/' + type + '.png">' + key + "</h4>",
        className: "select-li clickable"

      }).appendTo( "#ui-import-to" );

      $li.data( "type",  type );
    });

    //  Render Export menu
    _.each( [ "Code (Popcorn)", "Project", "Full Page", "Embeddable Fragment", "Preview" ], function ( key ) {
      var type = key.split(/\s/)[0].toLowerCase(),
      $li = $("<li/>", {

        html: '<h4><img class="icon" src="img/' + type + '.png">' + key + "</h4>",
        className: "select-li clickable"

      }).appendTo( "#ui-export-to" );

      $li.data( "type",  type );
    });

    //  Render Help menu
    $( "#help-btn" ).click( function () {
      var helpDiv = document.createElement( "div" );
      helpDiv.innerHTML = "<p>[ Shift + Click ] on a track event to Delete it.</p>" +
                          "<p>[ Shift + Right or Left ] in the time display to jump to the next frame.</p>";
      $( helpDiv ).dialog ( {
        modal: true,
        title: "Help",
        autoOpen: true,
        width: 400,
        height: 435,
        buttons: {
          "Close": function() {
            $( this ).dialog( "close" );
          }
        }
      });
    });

    $deleteBtn.click( function () {

      var deleteDiv = document.createElement( "div" );
      deleteDiv.innerHTML = "Are you sure you want to delete?";

      $( deleteDiv ).dialog ( {

        modal: true,
        title: "Delete",
        autoOpen: true,
        buttons: {

          "No": function() {
            $( this ).dialog( "close" );
          },

          "Yes": function() {
            controls[ "remove" ]();
            $( "#prjDiv" ).dialog( "close" );
            $( this ).dialog( "close" );

          }

        } //buttons

      }); //dialog

    }); //deleteBtn.click

    //  Bind layout picker
    $layoutlist.delegate( "li", "click", function () {
      var $this = $( this );
      $this.toggleClass( "active" )
        .parents( ".is-menu" )
        .attr("data-layout", $(this).data( "type" ) );

      $this.siblings()
        .removeClass("active");
    });

    //  Bind theme picker
    $themelist.delegate( "li", "click", function () {
      var $this = $( this );
      $this.toggleClass( "active" )
        .parents( ".is-menu" )
        .attr("data-theme", $(this).data( "type" ) );

      $this.siblings()
        .removeClass("active");
    });

    //  THIS IS THE WORST CODE EVER.
    //  TODO: MOVE OUT TO FUNCTION DECLARATION - MAJOR ABSTRACTION
    //  Export options list event
    $importtolist.delegate( "li", "click", function () {

      if ( !$popcorn || !$popcorn.data ) {

        $doc.trigger( "applicationError", {
          type: "No Video Loaded",
          message: "I cannot export your movie - there is no video loaded."
        });

        return;
      }

      var elseif = {
        universal: function() {

          var $select = $("<select/>");
          var languages = {"English":"en","Albanian":"sq","Arabic (Saudi Arabia)":"ar-sa","Arabic (Iraq)":"ar-iq","Arabic (Egypt)":"ar-eg","Arabic (Libya)":"ar-ly","Arabic (Algeria)":"ar-dz","Arabic (Morocco)":"ar-ma","Arabic (Tunisia)":"ar-tn","Arabic (Oman)":"ar-om","Arabic (Yemen)":"ar-ye","Arabic (Syria)":"ar-sy","Arabic (Jordan)":"ar-jo","Arabic (Lebanon)":"ar-lb","Arabic (Kuwait)":"ar-kw","Arabic (U.A.E.)":"ar-ae","Arabic (Bahrain)":"ar-bh","Arabic (Qatar)":"ar-qa","Basque":"eu","Bulgarian":"bg","Belarusian":"be","Catalan":"ca","Chinese (Taiwan)":"zh-tw","Chinese (PRC)":"zh-cn","Chinese (Hong Kong SAR)":"zh-hk","Chinese (Singapore)":"zh-sg","Croatian":"hr","Czech":"cs","Danish":"da","Dutch (Standard)":"nl","Dutch (Belgium)":"nl-be","English (United States)":"en-us","English (United Kingdom)":"en-gb","English (Australia)":"en-au","English (Canada)":"en-ca","English (New Zealand)":"en-nz","English (Ireland)":"en-ie","English (South Africa)":"en-za","English (Jamaica)":"en-jm","English (Caribbean)":"en","English (Belize)":"en-bz","English (Trinidad)":"en-tt","Estonian":"et","Faeroese":"fo","Farsi":"fa","Finnish":"fi","French (Standard)":"fr","French (Belgium)":"fr-be","French (Canada)":"fr-ca","French (Switzerland)":"fr-ch","French (Luxembourg)":"fr-lu","Gaelic (Scotland)":"gd","Irish":"ga","German (Standard)":"de","German (Switzerland)":"de-ch","German (Austria)":"de-at","German (Luxembourg)":"de-lu","German (Liechtenstein)":"de-li","Greek":"el","Hebrew":"he","Hindi":"hi","Hungarian":"hu","Icelandic":"is","Indonesian":"id","Italian (Standard)":"it","Italian (Switzerland)":"it-ch","Japanese":"ja","Korean":"ko","Korean (Johab)":"ko","Latvian":"lv","Lithuanian":"lt","Macedonian (FYROM)":"mk","Malaysian":"ms","Maltese":"mt","Norwegian (Bokmal)":"no","Norwegian (Nynorsk)":"no","Polish":"pl","Portuguese (Brazil)":"pt-br","Portuguese (Portugal)":"pt","Rhaeto-Romanic":"rm","Romanian":"ro","Romanian (Republic of Moldova)":"ro-mo","Russian":"ru","Russian (Republic of Moldova)":"ru-mo","Sami (Lappish)":"sz","Serbian (Cyrillic)":"sr","Serbian (Latin)":"sr","Slovak":"sk","Slovenian":"sl","Sorbian":"sb","Spanish (Spain)":"es","Spanish (Mexico)":"es-mx","Spanish (Guatemala)":"es-gt","Spanish (Costa Rica)":"es-cr","Spanish (Panama)":"es-pa","Spanish (Dominican Republic)":"es-do","Spanish (Venezuela)":"es-ve","Spanish (Colombia)":"es-co","Spanish (Peru)":"es-pe","Spanish (Argentina)":"es-ar","Spanish (Ecuador)":"es-ec","Spanish (Chile)":"es-cl","Spanish (Uruguay)":"es-uy","Spanish (Paraguay)":"es-py","Spanish (Bolivia)":"es-bo","Spanish (El Salvador)":"es-sv","Spanish (Honduras)":"es-hn","Spanish (Nicaragua)":"es-ni","Spanish (Puerto Rico)":"es-pr","Sutu":"sx","Swedish":"sv","Swedish (Finland)":"sv-fi","Thai":"th","Tsonga":"ts","Tswana":"tn","Turkish":"tr","Ukrainian":"uk","Urdu":"ur","Venda":"ve","Vietnamese":"vi","Xhosa":"xh","Yiddish":"ji","Zulu ":"zu"};

          Popcorn.forEach( languages, function( value, key ) {

            var $option = $("<option/>", {
              value: value,
              innerHTML: key
            });

            $select.append( $option );
          });

          var $div = $("#ui-user-input");
          $div.append("Choose your language: ");
          $div.append($select);

          $div.dialog({

            model: true,
            autoOpen: true,
            title: "Import Butter Project",

            beforeClose: function() {
              $("#ui-user-input").empty();
            },

            buttons: {

             "Close": function() {
                $(this).dialog( "close" );
              },

              "Ok": function() {
                $(this).dialog( "close" );

                var videoURL = $ioVideoUrl.val();

                $.getJSON( "http://www.universalsubtitles.org/api/subtitles/?video_url=" + videoURL + "&language=" + $select.val() + "&callback=?", function( data ) {

                  if ( !data.length ) {

                    $doc.trigger( "applicationNotice", {

                      message: "Sorry, no subtitles in this language associated with this video."

                    });

                    return;
                  }

                  for ( var i = 0, subsLength = data.length; i < subsLength; i++ ) {

                    addTrackEvent({
                      start: data[ i ].start_time,
                      end: data[ i ].end_time,
                      text: data[ i ].text,
                      type: "subtitle"
                    });
                  }

                  var $subDiv = document.getElementById( "subtitlediv" ) || document.createElement( "div" );
                  $subDiv.style.zIndex = 9001;
                });
              },
   
            }
          });
        },
        project: function() {

          controls.import();
        }
      };

      elseif[$(this).data( "type" )]();
    });

    $exporttolist.delegate( "li", "click", function () {


      if ( !$popcorn || !$popcorn.data ) {

        $doc.trigger( "applicationError", {
          type: "No Video Loaded",
          message: "I cannot export your movie - there is no video loaded."
        });

        return;
      }
      var locationHref = location.href,
          isPath = locationHref[locationHref.length - 1] === "/",
          locationAry;

      if ( !isPath ) {

        locationAry = locationHref.split("/");
        locationHref = "//" + locationAry.slice(2, locationAry.length -1 ).join("/") + "/";

      }


      var $this = $(this),
          type = $this.data( "type" ),
          theme = $themelist.attr( "data-theme" ),
          layout = $layoutlist.attr( "data-layout" ),
          $exports = $('[data-export="true"]'),
          $html = $exports.filter("div"),
          exports = {
            open: "<!doctype html>\n<html>",
            head: "\n<head>\n",
            meta: "<title>"+ $ioVideoTitle.val() +"</title>\n", 
            theme: '<link rel="stylesheet" href="' + locationHref + 'themes/' + theme + '/theme.css" type="text/css" media="screen">\n',
            layout: '<link rel="stylesheet" href="' + locationHref + 'layouts/' + layout + '/layout.css" type="text/css" media="screen">\n',
            scripts: "",
            body: "\n</head>\n<body>\n",
            html: "", 
            close:"\n</body>\n</html>\n"
          }, 
          compile = "", 

          playbackAry = [ '$(function () { ', '  var $p = Popcorn("#video")', '  //uncomment to auto play', '  //$p.play();', '});\n' ],
          compiled = "",
          stripAttrs = [ "style", "width", "height" ];



      //  Compile scripts
      //  TODO: generate this from loaded plugins
      //  this is really awful
      _.each( [
          "http://code.jquery.com/jquery-1.6.1.min.js",
          "http://popcornjs.org/code/dist/popcorn-complete.min.js",
          /*
          "popcorn-js/popcorn.js",
          "popcorn-js/plugins/googlemap/popcorn.googlemap.js",
          "popcorn-js/plugins/footnote/popcorn.footnote.js",
          "popcorn-js/plugins/webpage/popcorn.webpage.js",
          "popcorn-js/plugins/flickr/popcorn.flickr.js",
          "popcorn-js/plugins/image/popcorn.image.js",
          "popcorn-js/plugins/wikipedia/popcorn.wikipedia.js",
          "popcorn-js/plugins/twitter/popcorn.twitter.js"
          */
        ], function( sourceUri ) {


        // THIS IS A SERIOUS WTF WORKAROUND - THE LIVE GOOGLEMAPS PLUGIN THROWS ERRORS
        if ( /plugins/.test( sourceUri ) ) {
          //sourceUri = sourceUri.replace("plugins", "plugins-playback");
        }

        //exports.scripts += '<script src="' + locationHref + sourceUri + '"></script>\n';
        exports.scripts += '<script src="' + sourceUri + '"></script>\n';
      });

      //  Declare instance of the track store
      var tempStore = new TrackStore(),
          serialized = tempStore.serialize( $popcorn.data.trackEvents.byStart ),
          deserial = JSON.parse( serialized ),
          methods = [], panels = [];

      //  Build playback JS string
      _.each( deserial.data, function( obj, key ) {

        _.each( obj, function( data, dataKey ) {
          var dataObj = _.extend( {}, { id: dataKey }, data ),
              temp = {};

          //  Check each value and fix numbers
          _.each( dataObj, function( subVal, subKey ) {
            temp[ subKey ] = !isNaN( +subVal ) ? +subVal : subVal;
          });

          if ( temp['target-object'] ) {

            temp.target = temp['target-object'];
            delete temp['target-object'];

          } //if

          methods.push( dataKey + "(" + JSON.stringify( temp ) + ")" );
          panels.push( dataKey );

        });
      });

      //  If no mthods were compiled, then there are no tracks and
      //  hence, nothing to preview. Doing so will throw an exception
      if ( !methods.length ) {

        $doc.trigger( "applicationError", {
          type: "Stage Empty",
          message: "Your timeline is empty. There is nothing to export!"
        });

        return;
      }


      //  Compile html
      $html.each( function( iter, elem ) {

        var $this = $(this),
            $clone = $this.clone(),
            width = $this.width(),
            height = $this.height(),
            $children,
            html = "";
        //  Remove unwanted nodes
        $clone.children("#ui-video-controls,hr").remove();

        //  Restore controls
        if ( $clone.find("video").length ) {

          var $videoDiv = $("<div/>", { className: "butter-video-player" } ),
              $videoClone = $clone.find("video").clone();

          $videoClone.attr("autobuffer", "true");
          $videoClone.attr("preload", "auto");
          
          //this forces controls="true" instead of controls="" (bug?)
          $videoClone[0].setAttribute("controls", "true");

          $videoDiv
            .append( '\n        <h1 id="videoTitle">' + $ioVideoTitle.val() + '</h1>\n        ')
            .append( $videoClone )
            .append('\n        <p id="videoDescription">' + $ioVideoDesc.val() + '</p>\n      ');

          $clone.children("video").replaceWith( $videoDiv );

          compile += '\n    <div class="butter-video">\n      ' + $.trim( $clone.html() ) + '\n    </div>\n  ';
        }

        /*
        if ( $clone.find(".ui-plugin-pane").length ) {

          $clone.find(".ui-plugin-pane").each(function () {

            var $this = $(this);

            //  If the plugin pane is not actually in the movie, remove it
            if ( !_.contains( panels, $this.data("plugin") ) ) {
              var ref = $this.data("plugin");

              $clone.children('[data-plugin="' + ref + '"]').remove();
              return;
            }

            //  Remove any unwanted child nodes
            $this.attr("class", "butter-plugin").children().remove();

            //  Strip out all defined attributes
            _.each( stripAttrs, function ( key ) {
              $this.removeAttr( key );
            });
          });

          compile += '\n    <div class="butter-plugins">\n       ' + $clone.html() + '\n    </div>\n';
        }
        */

        if ( $clone.find("#ui-plugin-container").length ) {

          var divs = {},
              pluginHTML = '';

          for ( var trackId in tracklinerTracks ) {
  
            if ( tracklinerTracks.hasOwnProperty( trackId ) ) {
  
              var track = tracklinerTracks[trackId],
                  events = track.getTrackEvents();
  
              for ( var eventName in events ) {
      
                var trackEvent = events[ eventName ],
                    popcornEvent = $popcorn.getTrackEvent( trackEvent.pluginOptions.id ),
                    target = popcornEvent['target-object'];
  
                if ( target && !divs[ target ] ) {
  
                  pluginHTML += '\n        <div id="' + target + '"></div>\n';
                  divs[ target ] = target;
  
                } //if
  
              } //for
  
            } //if
  
          } //for
  
          compile += '\n    <div class="butter-plugins">\n    ' + pluginHTML + '\n</div>\n';
  
        } //if

      });


      //  Attach playback string commands
      playbackAry[ 1 ] += "." + methods.join(".") + ";";

      //  Wrap playback script export
      exports.scripts += '\n<script>' + playbackAry.join('\n') + '</script>';

      //  Wrap html export
      //  TODO: inject theme ID HERE
      exports.html = ' <div class="butter-player">' + compile + '  </div>';


      if( type === "full" ) {
        //  Compile all `exports`
        _.each( exports, function ( fragment, key) {
          compiled += fragment;
        });
      }
      else if ( type === "code" ) {
        compiled = playbackAry.join('\n');
      }
      else if ( type === "project" ) {

        var tracks = {};
        _.each( tracklinerTracks, function( track, key, i ) {
          
          var trackEvents = track.getTrackEvents(),
              trackIds = []; 

          _.each( trackEvents, function ( trackEvent, trackEventKey, idx ) {

            trackIds.push(trackEvent.pluginOptions.id);

          });

          tracks[track.getElement().id] = trackIds;

        }); //each

        tempStore.Title( $ioVideoTitle.val() );
        tempStore.Description( $ioVideoDesc.val() );
        tempStore.Remote( $ioVideoUrl.val() );
        tempStore.Theme( $themelist.attr( "data-theme" ) );
        tempStore.Layout( $layoutlist.attr( "data-layout" ) );
        tempStore.data = deserial;
        tempStore.targets = targetDatabase.getObjects();
        tempStore.tracks = tracks;
        compiled = JSON.stringify( tempStore );
      }
      else {

        //  Only compile fragment
        compiled = exports.scripts + "\n" + exports.theme + "\n" + exports.layout + "\n" + exports.html;
      }

      $doc.trigger( "exportReady", {
        type: type,
        content: compiled
      });


    });


    //  Application wide data store
    $doc.data( "current", {

      tracks: {},
      project: {}

    });



    $doc.bind( "applicationError applicationNotice applicationAlert", function( event, options ) {

      var defaultHandler = function() {

        $uiApplicationMsg.dialog( "close" );

        //  Cleanup
        $("#ui-error-rendered").remove();

        $uiApplicationMsg.empty();

      },
      buttons = {
        "Close": defaultHandler
      };


      if ( event.type === "applicationNotice" ) {

        buttons = {
          "Cancel": defaultHandler,
          "Ok": function() {

            //  If a callback specified, execute
            options.callback && options.callback();

            //$uiApplicationMsg.dialog( "close" );

            //  Run default handler to clean and close
            defaultHandler.call( this );

          }
        };


        if ( !options.type ) {
          options.type = "Confirm";
        }
      }

      //  Remove previous html
      $uiApplicationMsg.empty();


      $("<div/>", {
        id: "ui-error-rendered",
        html: options.message
      }).appendTo( "#ui-application-error" );


      $uiApplicationMsg.dialog({

        title: options.type,
        height: !!options.message ? 200 : 0,
        buttons: buttons,

        width: 300,
        modal: true,
        autoOpen: true,

        beforeClose: function() {

          //defaultHandler.call(this);

        }


      });
    });


    //  Show export screen
    $doc.bind( "exportReady", function( event, options ) {

      //$exportready.show();



      var $div = $("#ui-preview-viewer").dialog({
        modal: true,
        width: $body.width() - 50,
        height: $body.height() - 50,
        autoOpen: true,
        title: _( options.type ).capitalize(),

        beforeClose: function() {

          $("#ui-preview-viewer").empty();
          $("#ui-preview-rendered").remove();

        },
        buttons: {

          "Close": function() {

            $(this).dialog( "close" );
            $("#ui-preview-rendered").remove();

          }
        }
      });

      _.extend( options, {

        parent: $div

      });


      TrackExport.exports(options);

    });


    // ^^^^^^^^^^^^^^^^^^^ THIS IS THE WORST CODE EVER.

    $("#ui-panel-preview .sortable").sortable();

    //  User video list event
    $("#ui-start-screen-list, #ui-user-videos").delegate( "li", "click", function( event, options ) {

      if ( options && options.special ) {


        $uiLoadingHtml.find("p").text( options.special );


      }

      var $this = $(this),
          trackEvents = $this.data( "track" ),
          projectData = $this.data( "project" );

      if ( projectData ) {

        //  Load track and project data
        TrackMeta.project.load( trackEvents, projectData );

        //  Store currently active project
        $doc.data( "current", {
          tracks: trackEvents,
          project: projectData

        });
      }


      if ( $this.parents("#ui-start-screen-list").length ) {

        $("#ui-start-screen").dialog( "close" );

      }

    });


    //  When the window is resized, fire a timeupdate
    //  to reset the scrubber position
    $win.bind( "resize", function( event ) {

      if ( $popcorn && $popcorn.video ) {
        $popcorn.trigger( "timeupdate" );
      }
    });


    //  Updating the scrubber height - DEPRECATE.
    $doc.bind( "addTrackComplete" , function( event ) {

      TrackEditor.setScrubberHeight();

    });


    $doc.bind( "removeTrackComplete", function( event, data ) {

      var events = Popcorn.getTrackEvents( $popcorn ),
          type = data.type,
          count = 0,
          ret;

      _.each( events, function( data, key ) {
        if ( data._id.indexOf( type ) === 0 ) {
          count++;
          return;
        }
      });

      if ( !count ) {
        $('div[title="'+type+'"]').remove();

        delete activeTracks[ type ];
      }

      //  Complete with saving
      if ( !!$ioVideoTitle.val() ) {

        if ( data.suppress ) {
          return;
        }

        controls.save();

      }
    });



    //  Updating the scrubber height
    $doc.bind( "timelineReady videoReady", function( event ) {

      TrackEditor.setScrubberHeight();

    });


    //  Toggling the loading progress screen
    $doc.bind( "videoLoadStart videoLoadComplete", function( event ) {

      //  Display load-ready screen for `videoLoadStart` events
      if ( event.type === "videoLoadStart" ) {
        $loadready.show();
        return;
      }

      //  Always default to hide the load-ready screen
      $loadready.hide();

      //  Restore special messages to default text
      $uiLoadingHtml.find("p").text( $uiLoadingOrigMsg );


    });


    //  Listen for seekComplete events to adjust the track event workspace scrolling
    $doc.bind( "seekComplete", function( event, options ) {

      options.special &&  options.special();

      if ( options.type === "last" ) {
        $("#ui-tracks").scrollLeft( $("#ui-tracks-time-canvas").innerWidth() );
      }

      if ( options.type === "first" ) {
        $("#ui-tracks").scrollLeft( 0 );
      }
    });


    //  Update data view textarea
    $doc.bind( "videoEditComplete addTrackComplete", function( event, data ) {

      //var tempStore = new TrackStore();
      //$ioVideoData.val( tempStore.serialize( $popcorn.data.trackEvents.byStart ) );

    });

    // This if block allows trackMouseState to change only for Moz browsers, since
    // mouseup events aren't fired on scrollbars in any other browser (it's a bug).
    if ($.browser.mozilla) {
      $uitracks.bind( "mousedown mouseup", function( event ) {
        trackMouseState = event.type;
      });
    }
    else {
      trackMouseState = undefined;
    } //if

    //  Listen for clicks on the timescale display
    $tracktime.bind( "click", function( event ) {

      if ( !$popcorn || !$popcorn.video ) {
        return;
      }

      if ( event.ctrlKey ) {
        var $tracktimecanvas = $("#ui-tracks-time-canvas");
        $uitracks.animate({

          scrollLeft: $tracktimecanvas.innerWidth()/$popcorn.video.duration*$popcorn.video.currentTime

        }, "slow", function () {

          var quarterTime = Math.ceil( quarterTime ),
              increment = Math.round( $tracktimecanvas.width() / $popcorn.video.duration );

          TrackEditor.setScrubberPosition(
            ( increment * quarterTime ) + $tracktimecanvas.position().left + 1,
            {
              increments: increment,
              current: quarterTime
            }
          );
        }); // 600

      }
      else {
        var $this = $(this),
            increment = Math.round( $("#ui-tracks-time-canvas").innerWidth() / $popcorn.video.duration ),
            quarterTime = _( (event.clientX - $tracktime.offset().left) / increment ).fourth();

        $popcorn.video.currentTime = quarterTime;
      } //if

      //$uitracks.trigger( "scrollstop" );

    });


    //  Listen for scrolling on the track event workspace
    $uitracks.bind( "scrollstop", function( event ) {


      //  If no video is loaded, early return
      if ( !$popcorn.video ) {
        return;
      }

      // force an update of the video's time
      $popcorn.video.currentTime = $popcorn.video.currentTime;

    });


    $menucontrols.bind( "click", function( event ) {

      event.preventDefault();

      var $this = $(this);

      if ( !!$this.attr("data-control") ) {
        controls[ $this.attr("data-control") ]();
      }

    });

    $videocontrols.children("button").bind( "click", function( event ) {

      // was elegant, now its not. needs to be fixed
      var $this = $(this).children("span").children("span");

      if ( !$popcorn || !$popcorn.data ) {

        $doc.trigger( "applicationError", {
          type: "No Video Loaded",
          message: "I cannot " + $this.attr("data-control") + " - there is no video loaded"
        });

        return;
      }

      controls[ $this.attr("data-control") ]( $this.attr("data-opt") );

    });

    //  TODO: Revise
    $ioCurrentTime.bind( "keydown", function( event ) {

      //  Enter
      //if ( event.which === 13 ) {
        //controls.seek( "seek:io-current-t$this.dialog( "close" );ime" );
      //}

      //  Arrow right
      if ( event.which === 39 && event.shiftKey ) {
        $('[data-opt="next"]').parents("button").trigger("click");
      }

      //  Arrow left
      if ( event.which === 37 && event.shiftKey ) {
        $('[data-opt="prev"]').parents("button").trigger("click");
      }

    });
    
    $("#prjBtn").bind( "click", function( event ) {
      
      if( !$uiStartScreen.dialog( "isOpen" ) ) {
        $uiStartScreen.dialog( "open" );
      }
    });

    global.$popcorn = $popcorn;
  });

})( this, this.document, this.jQuery, this._, this.Popcorn );
//  Pass ref to jQuery and Underscore.js

