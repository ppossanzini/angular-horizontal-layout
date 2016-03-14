/* global angular */
angular.module("horizontal-layout",[])
.directive("panelContainer", function () {
  return {
    restrict: "E",
    transclude: true,
    template: '<div class="horizontal-scroller"><div class="panel-container" ng-transclude></div></div>',
    // templateUrl: "app/directives/panelContainer.html",
    link: function (scope, element, attr) {
      scope.$on("panel_show_request", function (e, n) { scope.$broadcast("panel_show", n); });
      scope.$on("panel_hide_request", function (e, n) { scope.$broadcast("panel_hide", n); });
      scope.$on("panel_hideallwithme_request", function (e, n) {
        var panels = element.find("panel");
        var found = false;
        for (var i = 0; i < panels.length; i++) {
          var p = panels[i];
          if (p) try {
            var pname = angular.element(p.children[0]).scope().name;
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
            var pname = angular.element(p.children[0]).scope().name;
            if (n === pname) { found = true; continue; }
            if (found) scope.$broadcast("panel_hide", pname);
          } catch (err) { }
        }
      });
    }
  }
})
.directive("panel", ["$timeout", function ($timeout) {
  return {
    restrict: "E",
    transclude: true,
    //replace: true,
    //templateUrl: "app/directives/panel.html",
    template: '<div class="panel-divider" ng-if="divider"><span>{{divider}}</span></div><div class="navigation-panel" ng-style="{width:currentSize}"><div class="navigation-panel-header"><div class="panel-title pull-left">{{title}}</div><div class="btn-group btn-group-xs pull-right square-borders"><button class="btn btn-sm" ng-click="changeSize(\'S\')" ng-if="canGrow"><i class="glyphicon glyphicon-resize-small"></i></button><button class="btn btn-sm" ng-click="changeSize(\'N\')" ng-if="canGrow"><i class="glyphicon glyphicon-resize-full"></i></button><button class="btn btn-sm" ng-click="changeSize(\'B\')" ng-if="canGrow"><i class="glyphicon glyphicon glyphicon-fullscreen"></i></button><button class="btn btn-sm" ng-click="remove()" ng-if="canClose"><i class="glyphicon glyphicon-remove"></i></button></div></div><div class="navigation-panel-body" ng-transclude></div></div>',
    scope: { title: "@title", name: "@", visible: "@", hideOnlyMe: "@", onShow: "&", onHide: "&", minSize: "@", maxSize: "@", size: "@", divider: "@" },
    link: function (scope, element, attr) {
      scope.canGrow = JSON.parse(attr.canGrow || "true");
      scope.canClose = JSON.parse(attr.canClose || "true");
    },
    controller: ["$scope", "$element", "navigator", function ($scope, $element, navigator) {

      $scope.currentSize = $scope.size || "50vw";
      $scope._sizeState = "N";

      $scope.changeSize = function (require) {
        switch (require) {
          case 'N': $scope.currentSize = $scope.size || "50vw"; $scope._sizeState === 'N'; break;
          case 'S': $scope.currentSize = $scope.minSize || "200px"; $scope._sizeState === 'S'; break;
          case 'B': $scope.currentSize = $scope.maxSize || "900vw"; $scope._sizeState === 'B'; break;
          default:
        }
      }

      if ($scope.visible !== "true") {
        $element.css("display", "none");
      }

      $scope.$on("panel_show", function (e, n) {
        if (n === $scope.name) {
          $element.css("display", "flex");
          if ($scope.onShow()) $scope.onShow()();
        }
      });

      $scope.$on("panel_hide", function (e, n) {
        if (n === $scope.name) {
          $element.css("display", "none");
          if ($scope.onHide()) $scope.onHide()();
        }
      });

      $scope.$on("changeSizeTo", function (e, n) {
        $scope.changeSize(n);
      })

      $scope.remove = function () {
        if ($scope.hideOnlyMe === "true")
          navigator.hide($scope, $scope.name);
        else
          navigator.hideAllWithMe($scope, $scope.name);
      };
    }]
  };
}])
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
    },
    changeSizeTo: function (scope, size) {
      scope.$emit("changeSizeTo", size);
    }
  };
}]);