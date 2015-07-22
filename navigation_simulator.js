(function() {
  var NavigationSimulator = function() {

    // Navigation control from keyboard
    this.keyNavigatorAdapter = new KeyNavigationAdapter();
    this.keyNavigatorAdapter.init();
    this.keyNavigatorAdapter.on('move', this._onMove.bind(this));

    // spatialNavigator will only navigate elements that are focusable
    this.spatialNavigator = new SpatialNavigator([], {
      ignoreHiddenElement: true
    });
    this.spatialNavigator.on('focus', this._onFocus.bind(this));

    // parse DOM tree and add all elements into spatial navigator
    this._scanDomTree(document.body);

    this._addDomTreeObservor();
    this._overrideFocus();
  };

  var nsProto = NavigationSimulator.prototype = {};

  nsProto._scanDomTree = function ns__scanDomTree(root, operation) {
    var childNodes = Array.prototype.slice.call(root.children, 0);
    operation = operation || 'add';
    this._scanChildNodes(childNodes, operation);

    // scan shadow DOM
    if (root.shadowRoot) {
      childNodes = Array.prototype.slice.call(root.shadowRoot.children, 0);
      this._scanChildNodes(childNodes, operation);
    }
  };

  nsProto._scanChildNodes = function ns__scanChildNodes(childNodes, operation) {
    childNodes.forEach(function(node) {
      if (this._isValidElement(node)) {
        this.spatialNavigator[operation](node);
        this._scanDomTree(node, operation);
      }
    }.bind(this));
  };

  nsProto._addDomTreeObservor = function ns__addDomTreeObservor() {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var addedNodes = Array.prototype.slice.call(mutation.addedNodes, 0);
        addedNodes.forEach(function(node) {
          if (this._isValidElement(node)) {
            this.spatialNavigator.add(node);
            // if tree is modified by innerHTML, only top-most nodes will be observed
            // need to recursively scan all subtrees
            this._scanDomTree(node);
          }
        }.bind(this));

        var removedNodes = Array.prototype.slice.call(mutation.removedNodes, 0);
        removedNodes.forEach(function(node) {
          if (this._isValidElement(node)) {
            this.spatialNavigator.remove(node);
            this._scanDomTree(node, 'remove');
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
    this.spatialNavigator.move(key);
  };

  nsProto._onFocus = function ns__onFocus(element) {
    console.log('New Focus: ', element);
    console.groupEnd();

    if (element) {
      element.focus();
    }
  };

  nsProto._overrideFocus = function ns__overrideFocus() {
    var navigationSimulator = this;
    var originalFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function() {
      // prevent recursive
      if (navigationSimulator.spatialNavigator._focus !== this) {
        navigationSimulator.spatialNavigator.focus(this);
      }
      originalFocus.call(this);
    };
  };

  window.navigationSimulator = new NavigationSimulator();
})();
