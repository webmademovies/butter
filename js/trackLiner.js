/*(function() {
  //<script src="http://code.jquery.com/jquery-1.5.js"></script>
  //<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.js"></script>
  var TrackLiner = this.TrackLiner = function( elementId ) {

    var tracks = {},
        trackCount = 0,
        eventCount = 0,
        parent = document.createElement( "div" ),
        container = document.createElement( "div" ),
        self = this,
        definition = {
          setup: function() {},
          moved: function() {},
          dblclick: function() {},
          drop: function() {}
        },
        callback = function( event, ui ) {

          var eventElement = ui.helper[ 0 ],
              trackObject = self.getTrack( eventElement.parentNode.id ),
              trackElement = trackObject.getElement(),
              eventObject = trackObject.getTrackEvent( eventElement.id ).event;

          eventElement.style.top = "0px";
          definition.moved( eventObject, eventElement, trackElement );
          //definition.setup( eventObject, eventElement, trackElement );
        };

    document.getElementById( elementId ).appendChild( parent );
    parent.style.height = "100%";
    parent.appendChild( container );

    $( container ).sortable( { containment: "parent", tolerance: 'pointer' } ).droppable( { greedy: true } );

    $( parent ).droppable({
      // this is dropping an event on empty space
      drop: function( event, ui ) {

        if ( ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {

          var eventId = ui.draggable[ 0 ].id,
              parentId = ui.draggable[ 0 ].parentNode.id,
              newTrack = self.createTrack();

          if ( self.getTrack( parentId ) ) {

            newTrack.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
          } else {

            newTrack.createTrackEvent( definition.drop( event, ui, newTrack.getElement() ) );
          }
        }
      }
    });

    var Track = function(inc) {

      var trackId = "trackLiner" + trackCount++,
          events = {},
          element = document.createElement( "div" );

      element.style.background = "-moz-linear-gradient(top,  #eee,  #999)";
      element.style.height = "36px";
      element.style.position = "relative";
      element.id = trackId;

      $( element ).droppable( { greedy: true,
        // this is dropping an event on a track
        drop: function( event, ui ) {

          var eventId = ui.draggable[ 0 ].id,
              trackId = this.id,
              parentId = ui.draggable[ 0 ].parentNode.id,
              newTrack = self.getTrack( trackId );

          if ( self.getTrack( parentId ) ) {

            newTrack.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
          } else {

            newTrack.createTrackEvent( definition.drop( event, ui, newTrack.getElement() ) );
          }
        }
      });

      this.getElement = function() {

        return element;
      };

      this.createTrackEvent = function( event ) {

        var trackEvent = {},
            eventId = "trackEvent" + eventCount++;
        
        trackEvent.event = event;
        trackEvent.element = document.createElement( "div" );
        trackEvent.element.style.cursor = "move";
        trackEvent.element.style.background = "-moz-linear-gradient(top,  #ff0,  #660)";
        trackEvent.element.style.opacity = "0.5";
        trackEvent.element.style.height = "36px";
        trackEvent.element.style.width = "100px";
        trackEvent.element.style.position = "absolute";
        trackEvent.element.style.top = "0px";
        trackEvent.element.style.left = "0px";
        trackEvent.element.id = eventId;
        trackEvent.element.addEventListener( "dblclick", function( event ) {

          definition.dblclick( trackEvent.event, trackEvent.element, element, event );
        }, false );
        //trackEvent.element = element;

        $( trackEvent.element ).draggable( { containment: parent, zIndex: 9001, scroll: true,
          // this is when an event stops being dragged
          stop: callback
        }).resizable( { autoHide: true, containment: "parent", handles: 'e, w', scroll: false,
          stop: callback
        });

        this.addTrackEvent( trackEvent );
        definition.setup( trackEvent.event, trackEvent.element, element );

        return trackEvent;
      };

      this.addTrackEvent = function( trackEvent ) {

        events[ trackEvent.element.id ] = trackEvent;
        element.appendChild( trackEvent.element );
        return this;
      };

      this.getTrackEvent = function( id ) {

        return events[ id ];
      };

      this.removeTrackEvent = function( id ) {

        var trackEvent = events[ id ];
        delete events[ id ];
        element.removeChild( trackEvent.element );
        return trackEvent;
      };

      this.toString = function() {

        return trackId;
      };
    };

    this.createTrack = function() {

      //index = ~index || ~trackArray.length;
      var track = new Track();
      container.appendChild( track.getElement() );
      tracks[ track.getElement().id ] = track;//.splice( ~index, 0, track );
      return track;
    };

    this.getTrack = function( id ) {

      return tracks[ id ];
    };

    this.addTrack = function( track ) {

      container.appendChild( track.getElement() );
      tracks[ track.getElement().id ] = track;
    };

    this.removeTrack = function( track ) {

      container.removeChild( track.getElement() );
      delete tracks[ track.getElement().id ];
      return track;
    };

    this.plugin = function( def ) {

      definition = def;
    };

    return this;
  };
}());
*/

(function(window) {
  //<script src="http://code.jquery.com/jquery-1.5.js"></script>
  //<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.js"></script>

  var plugins = {};

  function addPlugin ( name, def ) {
    def.setup = def.setup || function (){};
    def.moved = def.moved || function (){};
    def.click = def.click || function (){};
    def.dblclick = def.dblclick || function (){};
    if ( name ) {
      plugins[name] = def;
    } //if
  } //addPlugin

  var TrackLiner = this.TrackLiner = function( options ) {

    var tracks = {},
        trackCount = 0,
        eventCount = 0,
        userElement,
        dynamicTrackCreation = options.dynamicTrackCreation,
        duration = (options && options.duration) || 1,
        scale = options.scale || 1,
        parent = document.createElement( "div" ),
        container = document.createElement( "div" ),
        self = this;

    if ( this !== window ) {

      if ( typeof(options) === 'string' ) {
        userElement = document.getElementById(options);
      }
      else {
        userElement = document.getElementById(options.element);
      } //if

      userElement.appendChild( parent );
      parent.style.height = "100%";
      parent.appendChild( container );

      $( container ).sortable( { containment: "parent", tolerance: 'pointer' } ).droppable( { greedy: true } );

      $( parent ).droppable({
        // this is dropping an event on empty space
        drop: function( event, ui ) {

          if ( dynamicTrackCreation && ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {

            var eventId = ui.draggable[ 0 ].id,
                type = ui.draggable[ 0].getAttribute('data-trackliner-type') || 'default',
                parentId = ui.draggable[ 0 ].parentNode.id,
                newTrack = self.createTrack();

            if ( self.getTrack( parentId ) ) {
              newTrack.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
            } else {
              newTrack.createTrackEvent( type, {left: event.clientX/scale}, event, ui );
            } //if

          } //if
        }
      });

      this.createTrack = function( name ) {

        //index = ~index || ~trackArray.length;
        var track = new Track(),
            element = track.getElement();
        
        container.appendChild( element );

        if ( name ) {
          var titleElement = document.createElement('span');
          titleElement.style.postion = 'absolute';
          titleElement.style.left = '5px';
          titleElement.style.top = '50%';
          titleElement.innerHTML = name;
          
          element.appendChild( titleElement );
        } //if

        tracks[ track.getElement().id ] = track;//.splice( ~index, 0, track );
        return track;
      };

      this.getTrack = function( id ) {

        return tracks[ id ];
      };

      this.addTrack = function( track ) {

        container.appendChild( track.getElement() );
        tracks[ track.getElement().id ] = track;
      };

      this.removeTrack = function( track ) {

        container.removeChild( track.getElement() );
        delete tracks[ track.getElement().id ];
        return track;
      };

      this.plugins = plugins;

      this.plugin = addPlugin;

      this.setScale = function ( scale ) {
        userElement.style.width = duration * scale + "px";
        userElement.style.minWidth = duration * scale + "px";
      };

      this.setScale(scale);

      var Track = function(inc) {

        var trackId = "trackLiner" + trackCount++,
            events = {},
            that = this,
            element = document.createElement( "div" );

        element.style.background = "-moz-linear-gradient(top,  #eee,  #999)";
        element.style.height = "36px";
        element.style.position = "relative";
        element.id = trackId;

        $( element ).droppable( { 
          greedy: true,

          // this is dropping an event on a track
          drop: function( event, ui ) {

            var eventId = ui.draggable[ 0 ].id,
                trackId = this.id,
                type = ui.draggable[ 0].getAttribute('data-trackliner-type') || 'default',
                parentId = ui.draggable[ 0 ].parentNode.id;

            if ( self.getTrack( parentId ) ) {

              self.getTrack( trackId ).addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
            }
            else {

              if ( type && plugins[ type ]) {
                self.getTrack( trackId ).createTrackEvent( type, {left: event.clientX/scale}, event, ui );
              } //if

            } //if
          }
        });

        this.getElement = function() {
          return element;
        };

        this.createEventElement = function ( options ) {
          var element = document.createElement('DIV');
          element.style.cursor = options.cursor || "move";
          element.style.background = options.backgroud || "-moz-linear-gradient(top,  #ff0,  #660)";
          element.style.opacity = options.opacity || "0.5";
          element.style.height = options.height || "100%";
          element.style.width = options.width ? options.width*scale + "px" : "100px";
          element.style.position = options.position || "absolute";
          element.style.top = options.top || "0px";
          element.style.left = options.left ? options.left*scale + "px" : "0px";
          element.innerHTML = options.innerHTML || '';
          return element;
        } //createEventElement

        this.createTrackEvent = function( type, inputOptions, event, ui ) {

          var trackEvent = {},
              eventId = "trackEvent" + eventCount++,
              inputOptions = typeof(type) === 'string' ? inputOptions : type,
              type = typeof(type) === 'string' ? type : 'default',
              pluginDef = plugins[ type ];

          if (pluginDef) {

            var trackOptions = plugins[ type ].setup( that, inputOptions, event, ui );
            var movedCallback = function( event, ui ) {

              var eventElement = ui.helper[ 0 ],
                  trackObject = self.getTrack( eventElement.parentNode.id ),
                  trackElement = trackObject.getElement(),
                  eventObject = trackObject.getTrackEvent( eventElement.id ).event;

              eventElement.style.top = "0px";
              pluginDef.moved( trackObject, trackEvent, event, ui );
            };

            trackEvent.event = trackOptions;
            trackEvent.element = trackOptions.element || this.createEventElement ( trackOptions );
            trackEvent.element.id = eventId;
            trackEvent.element.addEventListener('click', function (e) {

              var eventElement = ui.helper[ 0 ],
                  trackObject = self.getTrack( eventElement.parentNode.id ),
                  trackElement = trackObject.getElement(),
                  eventObject = trackObject.getTrackEvent( eventElement.id ).event;

              pluginDef.click( trackObject, trackEvent, event, ui );
            }, false);
            trackEvent.element.addEventListener('dblclick', function (e) {

              var eventElement = ui.helper[ 0 ],
                  trackObject = self.getTrack( eventElement.parentNode.id ),
                  trackElement = trackObject.getElement(),
                  eventObject = trackObject.getTrackEvent( eventElement.id ).event;

              pluginDef.dblclick( trackObject, trackEvent, event, ui );
            }, false);
            trackEvent.type = type;
            //trackEvent.element = element;

            $( trackEvent.element ).draggable( { /*grid: [ 1, 36 ],*/ containment: parent, zIndex: 9001, scroll: true,
              // this is when an event stops being dragged
              stop: movedCallback
            }).resizable( { autoHide: true, containment: "parent", handles: 'e, w', scroll: false,
              stop: movedCallback
            });

            this.addTrackEvent( trackEvent );

            return this;
          } //if
        };

        this.addTrackEvent = function( trackEvent ) {
          events[ trackEvent.element.id ] = trackEvent;
          element.appendChild( trackEvent.element );
          return this;
        };

        this.getTrackEvent = function( id ) {

          return events[ id ];
        };

        this.removeTrackEvent = function( id ) {

          var trackEvent = events[ id ];
          delete events[ id ];
          element.removeChild( trackEvent.element );
          return trackEvent;
        };
        
        /*this.length = function() {

          return eventArray.length;
        };*/

        this.toString = function() {

          return trackId;
        };
      };

      /*this.length = function() {

        return trackArray.length;
      };*/

      return this;

    } //if (this !== window)

  }; //TrackLiner

  TrackLiner.plugin = addPlugin;

  window.TrackLiner = TrackLiner;

  TrackLiner.plugin( 'default', {
    setup: function ( track, options ) {

      var left = options.left || options.x || options.start || 0;
      var width = options.width || options.end ? options.end - left : 1;
      return {
        left: left,
        width: width,
        innerHTML: options.label || '',
      };
    },
    moved: function (trackEventObj, event, ui) {
      console.log('moved!');
    },
    click: function (trackEventObj, event) {
      console.log('click!');
    },
    dblclick: function (trackEventObj, event) {
      console.log('dblclick!');
    },
  });

}(window));

