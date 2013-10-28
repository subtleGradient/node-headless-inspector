/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY GOOGLE INC. AND ITS CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GOOGLE INC.
 * OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.Panel}
 * @implements {WebInspector.TabbedEditorContainerDelegate}
 */
WebInspector.StylesPanel = function()
{
    WebInspector.Panel.call(this, "styles");
    this.registerRequiredCSS("scriptsPanel.css");

    const initialNavigatorWidth = 225;
    const minimalViewsContainerWidthPercent = 50;

    this._mainView = new WebInspector.SplitView(WebInspector.SplitView.SidebarPosition.Left, "stylesPanelNavigatorSidebarWidth", initialNavigatorWidth);
    this._mainView.element.id = "styles-main-view";
    this._mainView.element.tabIndex = 0;

    this._mainView.minimalSidebarWidth = Preferences.minScriptsSidebarWidth;
    this._mainView.minimalMainWidthPercent = minimalViewsContainerWidthPercent;
    this._mainView.show(this.element);

    this._navigator = new WebInspector.ScriptsNavigator();
    this._navigatorView = this._navigator.view;
    this._navigator.view.show(this._mainView.sidebarElement);
    this._navigator.addEventListener(WebInspector.ScriptsNavigator.Events.ScriptSelected, this._scriptSelected, this);

    this._editorContainer = new WebInspector.TabbedEditorContainer(this, "previouslyViewedCSSFiles");
    this._editorContainer.show(this._mainView.mainElement);

    this._navigatorController = new WebInspector.NavigatorOverlayController(this, this._mainView, this._navigator.view, this._editorContainer.view);

    this._sourceFramesForResource = new Map();
    this._urlToResource = {};

    WebInspector.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.CachedResourcesLoaded, this._cachedResourcesLoaded, this);
    WebInspector.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.WillLoadCachedResources, this._reset, this);
    WebInspector.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.MainFrameNavigated, this._reset, this);
}

WebInspector.StylesPanel.prototype = {

    wasShown: function()
    {
        WebInspector.Panel.prototype.wasShown.call(this);
        this._navigatorController.wasShown();
        this._initialize();
    },

    _initialize: function()
    {
        if (!this._initialized && this.isShowing() && this._cachedResourcesWereLoaded) {
            this._populateResourceTree();
            this._initialized = true;
        }
    },

    _populateResourceTree: function()
    {
        WebInspector.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.ResourceAdded, this._resourceAdded, this);

        function populateFrame(frame)
        {
            for (var i = 0; i < frame.childFrames.length; ++i)
                populateFrame.call(this, frame.childFrames[i]);

            var resources = frame.resources();
            for (var i = 0; i < resources.length; ++i)
                this._resourceAdded({data:resources[i]});
        }
        populateFrame.call(this, WebInspector.resourceTreeModel.mainFrame);
    },

    _resourceAdded: function(event)
    {
        var resource = event.data;
        if (resource.type !== WebInspector.resourceTypes.Stylesheet)
            return;
        this._urlToResource[resource.url] = resource;
        this._navigator.addUISourceCode(resource);
        this._editorContainer.uiSourceCodeAdded(resource);
    },

    _reset: function()
    {
        this._navigator.reset();
        this._editorContainer.reset();
        this._urlToResource = {};
        this._sourceFramesForResource = new Map();
    },

    _cachedResourcesLoaded: function()
    {
        this._cachedResourcesWereLoaded = true;
        this._initialize();
    },

    get toolbarItemLabel()
    {
        return WebInspector.UIString("Styles");
    },

    /**
     * @param {WebInspector.UISourceCode} uiSourceCode
     * @return {WebInspector.SourceFrame}
     */
    viewForFile: function(uiSourceCode)
    {
        var sourceFrame = this._sourceFramesForResource.get(uiSourceCode);
        if (!sourceFrame) {
            sourceFrame = new WebInspector.EditableResourceSourceFrame(uiSourceCode);
            sourceFrame.addEventListener(WebInspector.EditableResourceSourceFrame.Events.TextEdited, this._textEdited, this);
            this._sourceFramesForResource.put(uiSourceCode, sourceFrame);
        }
        return sourceFrame;
    },

    _textEdited: function(event)
    {
        var sourceFrame = /** @type {WebInspector.EditableResourceSourceFrame} */ event.data;
        this._editorContainer.setFileIsDirty(sourceFrame.resource, sourceFrame.isDirty());
    },

    _scriptSelected: function(event)
    {
        var uiSourceCode = /** @type {WebInspector.UISourceCode} */ event.data.uiSourceCode;
        var sourceFrame = this._showFile(uiSourceCode);
        this._navigatorController.hideNavigatorOverlay();
        if (sourceFrame && event.data.focusSource)
            sourceFrame.focus();
    },

    _showFile: function(uiSourceCode)
    {
        this._navigator.revealUISourceCode(uiSourceCode);
        this._editorContainer.showFile(uiSourceCode);
    },

    canShowAnchorLocation: function(anchor)
    {
        var resource = WebInspector.resourceForURL(anchor.href);
        return !!resource && resource.type === WebInspector.resourceTypes.Stylesheet;
    },

    showAnchorLocation: function(anchor)
    {
        var resource = this._urlToResource[anchor.href];
        if (!resource)
            return;

        this._showFile(resource);
        var sourceFrame = this._sourceFramesForResource.get(resource);
        if (typeof anchor.lineNumber === "number")
            sourceFrame.highlightLine(anchor.lineNumber);
        sourceFrame.focus();
    }
}

WebInspector.StylesPanel.prototype.__proto__ = WebInspector.Panel.prototype;
