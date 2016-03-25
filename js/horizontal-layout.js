//use strict
/* global angular */

angular.module("horizontal-layout", [])
.directive("panelContainer", function () {
  return {
    restrict: "E",
    transclude: true,
    template: '<div class="horizontal-scroller"><div class="panel-container" ng-transclude></div></div>',
    // templateUrl: "app/directives/panelContainer.html",
    link: function (scope, element, attr) {
      scope.$on("panel_show_request", function (e, n) {
        scope.$broadcast("panel_show", { panelName: n, parent: e.targetScope });
      });
      scope.$on("panel_hide_request", function (e, n) { scope.$broadcast("panel_hide", n); });
      scope.$on("panel_hideallwithme_request", function (e, n) {
        var panels = element.find("panel");
        var found = false;
        for (var i = 0; i < panels.length; i++) {
          var p = panels[i];
          if (p) try {
            var pname = angular.element(p).attr('name');
            if (n === pname) found = true;
            if (found) scope.$broadcast("panel_hide", pname);
          } catch (err) { }
        }
      });
      scope.$on("panel_hideallbutme_request", function (e, n) {
        var panels = element.find("panel");
        var found = false;
        for (var i = 0; i < panels.length; i++) {
          var p = panels[i];
          if (p) try {
            var pname = angular.element(p).attr('name');
            if (n === pname) { found = true; continue; }
            if (found) scope.$broadcast("panel_hide", pname);
          } catch (err) { }
        }
      });
    },
    controller: function () { }
  }
})
.directive("panel", ["$timeout", "$animate", function ($timeout, $animate) {
  return {
    restrict: "E",
    transclude: 'element',
    priority: 600,
    //multiElement: true,
    require: "^panelContainer",
    //terminal: true,
    //$$tlb: true,
    //replace: true,
    //templateUrl: "app/directives/panel.html",
    //template: '<div class="panel-divider" ng-if="divider"><span>{{divider}}</span></div><div class="navigation-panel" ng-style="{width:currentSize}"><div class="navigation-panel-header"><div class="panel-title pull-left">{{title}}</div><div class="btn-group btn-group-xs pull-right square-borders"><button class="btn btn-sm" ng-click="changeSize(\'S\')" ng-if="canGrow"><i class="glyphicon glyphicon-resize-small"></i></button><button class="btn btn-sm" ng-click="changeSize(\'N\')" ng-if="canGrow"><i class="glyphicon glyphicon-resize-full"></i></button><button class="btn btn-sm" ng-click="changeSize(\'B\')" ng-if="canGrow"><i class="glyphicon glyphicon glyphicon-fullscreen"></i></button><button class="btn btn-sm" ng-click="remove()" ng-if="canClose"><i class="glyphicon glyphicon-remove"></i></button></div></div><div class="navigation-panel-body" ng-transclude></div></div>',
    scope: { title: "@title", name: "@", visible: "@", hideOnlyMe: "@", onShow: "&", onHide: "&", minSize: "@", maxSize: "@", size: "@", divider: "@" },
    link: {
      pre: function (scope, element, attr, parent, transclude) {
        scope.canGrow = JSON.parse(attr.canGrow || "true");
        scope.canClose = JSON.parse(attr.canClose || "true");

        var childScope, previousElements;
        //element.css("display", "flex");

        function changeVisibility(isvisible, d, targetScope) {
          if (isvisible) {
            if (!childScope) {

              function cloneFn(clone, newScope) {
                childScope = newScope;
                if (d) newScope.__data = d.data;
                scope.block = {
                  clone: clone
                };
                var children = element.parent().children();
                var lastchild = null;
                if (children.length > 0)
                  lastchild = children[children.length - 1];
                $animate.enter(clone, element.parent(), lastchild);
              }

              if (targetScope) {
                transclude(targetScope, cloneFn);
                targetScope.$apply(); // we have to force the digest of parent scope. 
                childScope = null; // if a targetScope is used, i have to avoid its destruction.
              }
              else
                transclude(cloneFn);
            }
          } else {
            if (previousElements) {
              previousElements.remove();
              previousElements = null;
            }
            if (childScope) {
              childScope.$destroy();
              childScope = null;
            }
            if (scope.block) {
              //previousElements = getBlockNodes(block.clone);
              $animate.leave(scope.block.clone).then(function () {
                previousElements = null;
              });
              scope.block = null;
            }
          }
        };
        if (scope.visible === "true") changeVisibility(true);

        scope.$on("panel_show", function (e, n) {
          if (n.panelName === scope.name) {
            changeVisibility(true, null, n.parent);
            var scroller = angular.element(".horizontal-scroller");
            if (scope.block)
              scroller.scrollLeft(scope.block.clone[0].offsetLeft);
            else
              scroller.scrollLeft(scroller.width());
            if (scope.onShow()) scope.onShow()();
          }
        });

        scope.$on("panel_hide", function (e, n) {
          if (n === scope.name) {
            changeVisibility(false);
            if (scope.onHide()) scope.onHide()();
          }
        });


      }
    },
    controller: ["$scope", "$element", "navigator", function ($scope, $element, navigator) {

      $scope.currentSize = $scope.size || "50vw";
      $scope._sizeState = "N";

      this.changeSize = function (require) {
        switch (require) {
          case 'N': $scope.currentSize = $scope.size || "50vw"; $scope._sizeState === 'N'; break;
          case 'S': $scope.currentSize = $scope.minSize || "200px"; $scope._sizeState === 'S'; break;
          case 'B': $scope.currentSize = $scope.maxSize || "90vw"; $scope._sizeState === 'B'; break;
          default:
        }


        var scroller = angular.element(".horizontal-scroller");

        if ($scope.block) {
          $scope.block.clone.css("min-width", $scope.currentSize);
          scroller.scrollLeft($scope.block.clone[0].offsetLeft);
        }
        else
          scroller.scrollLeft(scroller.width());

      }
      this.changeSize($scope._sizeState);

      $scope.remove = function () {
        if ($scope.hideOnlyMe === "true")
          navigator.hide($scope, $scope.name);
        else
          navigator.hideAllWithMe($scope, $scope.name);
      };

      this.getName = function () {
        return $scope.name;
      };

      this.hideOnlyThisPanel = function () {
        return $scope.hideOnlyMe;
      };
    }]
  };
}])
.directive("navigateTo", function () {
  return {
    restrict: "A",
    require: "^panel",
    link: function (scope, element, attr, parent) {
      var parentName = parent.getName();
      element.on("click", function () {
        scope.$emit("panel_hideallbutme_request", parentName);
        scope.$emit("panel_show_request", attr.navigateTo);
      });
    }
  }
})
.directive("panel", function () {
  return {
    restrict: 'A',
    require: "^panel",
    link: function (scope, element, attr, parent) {
      var parentName = parent.getName();
      var action = attr.panel;
      element.on("click", function () {
        switch (action) {
          case 'normal': parent.changeSize('N'); break;
          case 'small': parent.changeSize('S'); break;
          case 'big': parent.changeSize('B'); break;
          case 'close': {
            if (parent.hideOnlyThisPanel())
              scope.$emit("panel_hide_request", parentName);
            else
              scope.$emit("panel_hideallwithme_request", parentName);
            break;
          }
        }
      });
    }
  }
})
.factory("navigator", [function () {
  return {
    showPanel: function (scope, name) {
      scope.$emit("panel_show_request", name);
    },
    hide: function (scope, name) {
      scope.$emit("panel_hide_request", name);
    },
    hideAllWithMe: function (scope, name) {
      scope.$emit("panel_hideallwithme_request", name);
    },
    hideAllButMe: function (scope, name) {
      scope.$emit("panel_hideallbutme_request", name);
    }
  };
}]);