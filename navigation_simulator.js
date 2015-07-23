(function() {
  var NavigationSimulator = function() {

    // body is considered as default navigation container
    this.spatialNavigators = {};
    document.body.setAttribute('nav-id', 'body');

    // Keyboard navigation control
    this.keyNavigatorAdapter = new KeyNavigationAdapter();
    this.keyNavigatorAdapter.init();
    this.keyNavigatorAdapter.on('move', this._onMove.bind(this));

    // parse DOM tree and add all elements into spatial navigator
    this._scanDomTree(document.body);
    this._addDomTreeObservor();

    // trace active spatial navigator
    this.activeSpatialNavigator = this.spatialNavigators.body;

    // override focus function
    this._overrideFocus();

    // handle the case if a
    window.addEventListener('focus', function(e) {
      if (this._isValidElement(e.target)) {
        var newNav = this._getNavigator(e.target);
        if (newNav) {
          this.activeSpatialNavigator = newNav;
          e.target.focus();
        } else {
          console.error(e.target, ' is not navigable.');
        }
      }
    }.bind(this), true);
  };

  var nsProto = NavigationSimulator.prototype = {};

  nsProto._createSpatialNavigator = function ns__createSpatialNavigator() {
    var spatialNavigator = new SpatialNavigator([], {
      ignoreHiddenElement: true
    });
    spatialNavigator.on('focus', this._onFocus.bind(this));
    return spatialNavigator;
  };

  nsProto._getNavigator = function ns__createSpatialNavigator(element) {
    var navId = element.getAttribute('nav-id');
    if (navId) {
      return this.spatialNavigators[navId] || this._createSpatialNavigator();
    }
    return this._getNavigator(element.parentElement);
  };

  nsProto._scanDomTree = function ns__scanDomTree(root, operation, nav) {
    var navId = root.getAttribute('nav-id');
    if (navId) {
      nav = this.spatialNavigators[navId] || this._createSpatialNavigator();
      this.spatialNavigators[navId] = nav;
    }

    var childNodes = Array.prototype.slice.call(root.children, 0);
    operation = operation || 'add';
    this._scanChildNodes(childNodes, operation, nav);

    // scan shadow DOM
    if (root.shadowRoot) {
      childNodes = Array.prototype.slice.call(root.shadowRoot.children, 0);
      this._scanChildNodes(childNodes, operation, nav);
    }
  };

  nsProto._scanChildNodes = function ns__scanChildNodes(childNodes, operation, nav) {
    childNodes.forEach(function(node) {
      if (this._isValidElement(node)) {
        nav[operation](node);
        this._scanDomTree(node, operation, nav);
      }
    }.bind(this));
  };

  nsProto._addDomTreeObservor = function ns__addDomTreeObservor() {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var addedNodes = Array.prototype.slice.call(mutation.addedNodes, 0);
        addedNodes.forEach(function(node) {
          if (this._isValidElement(node)) {
            var nav = this._getNavigator(node);
            if (nav) {
              nav.add(node);
              // if tree is modified by innerHTML, only top-most nodes will be observed
              // need to recursively scan all subtrees
              this._scanDomTree(node, 'add', nav);
            }
          }
        }.bind(this));

        var removedNodes = Array.prototype.slice.call(mutation.removedNodes, 0);
        removedNodes.forEach(function(node) {
          if (this._isValidElement(node)) {
            var nav = this._getNavigator(node);
            if (nav) {
              nav.remove(node);
              // if tree is modified by innerHTML, only top-most nodes will be observed
              // need to recursively scan all subtrees
              this._scanDomTree(node, 'remove', nav);
            }
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));

    // observe whole DOM tree mutations
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });
  };

  nsProto._isValidElement = function ns__isValidElement(element) {
    if (element instanceof HTMLElement &&
        !(element instanceof HTMLStyleElement) &&
        !(element instanceof HTMLScriptElement)) {
      return true;
    }
    return false;
  };

  nsProto._onMove = function ns__onMove(key) {
    console.groupEnd();
    console.group('-----------Focus switching-----------');
    console.log('Move: ' + key);
    this.activeSpatialNavigator.move(key);
  };

  nsProto._onFocus = function ns__onFocus(element) {
    if (element &&
        element !== document.activeElement) {
      console.log('New Focus: ', element);
      element.focus();
    }
    console.groupEnd();
  };

  nsProto._overrideFocus = function ns__overrideFocus() {
    var navigationSimulator = this;
    var originalFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function() {
      var newNav = navigationSimulator._getNavigator(this);
      if (newNav) {
        navigationSimulator.activeSpatialNavigator = newNav;
      } else {
        console.error(e.target, ' is not navigable.');
        return;
      }

      originalFocus.call(this);
      navigationSimulator.activeSpatialNavigator.focus(this);
    };
  };

  window.navigationSimulator = new NavigationSimulator();
})();
