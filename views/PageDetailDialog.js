function PageDetailDialog() {
    Dialog.call(this);
    this.modified = false;
    this.title = "CREATE NEW PAGE";
    this.pageCombo.renderer = function (canvas) {
        return canvas.name;
    };
    this.pageCombo.decorator = function (node, canvas) {
    };

    this.pageSizeCombo.renderer = function (pageSize) {
        if (!pageSize.value) return pageSize.displayName;
        return pageSize.displayName + " (" + pageSize.value + ")";
    }

    this.backgroundCombo.renderer = function (background) {
        return background.displayName;
    };

    var thiz = this;





    this.pageCombo.addEventListener("p:ItemSelected", function (event) {
        thiz.modified = true;
    }, false);

    this.pageSizeCombo.addEventListener("p:ItemSelected", function (event) {
        var pageSize = thiz.pageSizeCombo.getSelectedItem();
        thiz.widthInput.disabled = pageSize.value;
        thiz.heightInput.disabled = pageSize.value;
        if (pageSize.value) {
            thiz.setPageSizeValue(pageSize.value);
        }

        thiz.modified = true;
    }, false);

    this.backgroundCombo.addEventListener("p:ItemSelected", function (event) {
        var background = thiz.backgroundCombo.getSelectedItem();
        //thiz.colorButton.style.display = background.value ? "none" : "block";
        if (background.value == null) {
            thiz.colorButton.disabled = false;
        } else {
            thiz.colorButton.disabled = true;
        }
        thiz.modified = true;
    }, false);

    this.colorButton.addEventListener("click", function (event) {
        var color = thiz.colorButton.color ? thiz.colorButton.style.color : Color.fromString("#FFFFFF");
        thiz.selector.setColor(color);
        thiz.selectorContainer.show(thiz.colorButton, "left-inside", "bottom", 0, 5);
        event.cancelBubble = true;
    }, false);

    this.selector.addEventListener("ValueChange", function (event) {
        var color = thiz.selector.getColor();
        //thiz.colorButton.bgColor = color;
        thiz.colorButton.style.color = color.toRGBString();
        thiz.modified = true;
    }, false);

    this.pageTitle.addEventListener("change", function (event) {
        thiz.modified = true;
    }, false);
}

__extend(Dialog, PageDetailDialog);

Page.defaultPageSizes = [
    {
        value: "800x600",
        displayName: "Compact Web page"
    },
    {
        value: "960x600",
        displayName: "960 Web page"
    },
    {
        value: "960x900",
        displayName: "960 Web page - long"
    },
    {
        value: "1024x768",
        displayName: "Normal Web page"
    },
    {
        value: "1280x800",
        displayName: "Large Web page"
    },
    {
        value: "774x1052",
        displayName: "A4 at 90dpi"
    },
    {
        value: "2480x3508",
        displayName: "A4 at 90dpi"
    }
];


PageDetailDialog.prototype.setPageSizeValue = function (value) {
    var index = value.indexOf("x");
    if (index > -1) {
        this.widthInput.value = value.substring(0, index);
        this.heightInput.value = value.substring(index + 1);
    }
}

PageDetailDialog.prototype.setup = function (options) {
    this.options = options;
    this.defaultPage = options.defaultPage;
    if (this.options && this.options.onDone) this.onDone = this.options.onDone;
    var pages = [];
    pages.push({
        name: "(None)"
    });
    pages = pages.concat(Pencil.controller.doc.pages);

    if (this.options && this.options.defaultPage) {
        var hideChildren = function (page, pagesIn) {
            for( var i = 0; i < page.children.length; i++) {
                if (page.children[i].children) {
                  hideChildren(page.children[i], pagesIn);
                }
                var index = pagesIn.indexOf(page.children[i]);
                pagesIn.splice(index, 1);
            }
        }
        var editPage = this.options.defaultPage;
        var index = pages.indexOf(editPage);
        pages.splice(index, 1);
        if (editPage.children) {
            hideChildren(editPage, pages);
        }
    }
    this.pageCombo.setItems(pages);

    if (this.options && this.options.defaultParentPage) {
        this.pageCombo.selectItem(this.options.defaultParentPage);
    }

    var pageSizes = [];

    var lastSize = Config.get("lastSize");
    if (lastSize) {
        pageSizes.push({
            displayName: "Last used",
            value: lastSize
        });
    }

    var bestFitSize = Pencil.controller.getBestFitSize();
    if (bestFitSize) {
        pageSizes.push({
            displayName: "Best fit",
            value: bestFitSize
        });
    }

    pageSizes.push({
        displayName: "Custome size..."
    });

    pageSizes = pageSizes.concat(Page.defaultPageSizes);
    this.pageSizeCombo.setItems(pageSizes);

    var backgroundItems = [
        {
            displayName: "Transparent Background",
            value: "transparent"
        },
        {
            displayName: "Background Color"
        }
    ];

    var pages = Pencil.controller.doc.pages;


    var createItem = function (pages, backgroundItems, padding) {
        var padding_tmp = padding;
        padding_tmp ++;
        for(var i = 0; i < pages.length; i++) {
            if(pages[i] != thiz.defaultPage) {
                backgroundItems.push({
                    displayName: pages[i].name,
                    value: pages[i].id,
                    padding:padding
                });
            }
            if (pages[i].children) {
                createItem(pages[i].children, backgroundItems,padding_tmp);
            }
        }
    }
    for(var i in pages) {
        var thiz =this;

        if (!pages[i].parentPage ) {
            if(pages[i] != thiz.defaultPage) {
                backgroundItems.push({
                    displayName: pages[i].name,
                    value: pages[i].id,
                });
            }
            if (pages[i].children) {
                var padding = 1;
                createItem(pages[i].children,backgroundItems,padding);
            }

        }
    }
    this.backgroundCombo.setItems(backgroundItems);

    var pageSize = this.pageSizeCombo.getSelectedItem();
    this.widthInput.disabled = pageSize.value;
    this.heightInput.disabled = pageSize.value;

    if(options.defaultPage) {
        this.setPageItem(options.defaultPage);
        // var background = this.backgroundCombo.getSelectedItem();
        //this.colorButton.style.display = background.value ? "none" : "block";

    }
    this.oldBody = this.dialogBody;
};

PageDetailDialog.prototype.setPageItem = function (page) {
    if(page.parentPage) {
        this.pageCombo.selectItem(page.parentPage);
    }
    this.pageTitle.value = page.name;

    var pageSizeValue = page.width + "x" + page.height;
    var index;
    for (var i in this.pageSizeCombo.items ) {
        if(this.pageSizeCombo.items[i].value == pageSizeValue) {
            index = this.pageSizeCombo.items[i];
        }
    }
    var thiz = this;
    if(index != null) {
        this.pageSizeCombo.selectItem(index);
        this.setPageSizeValue(index.value);
    } else {
        this.pageSizeCombo.selectItem({
            displayName: "Custome size..."
        });
        this.widthInput.disabled = false;
        this.heightInput.disabled = false;
        this.widthInput.value = page.width;
        this.heightInput.value = page.height;
        this.widthInput.addEventListener("change", function () {
            thiz.modified = true;
        }, false);
        this.heightInput.addEventListener("change", function () {
            thiz.modified = true;
        }, false);
    }

    if(page.backgroundColor) {
        this.backgroundCombo.selectItem({
             displayName: "Background Color"
        });
        this.colorButton.style.color = page.backgroundColor;
    }
    if (page.backgroundPage) {
        this.backgroundCombo.selectItem({
             displayName: page.backgroundPage.name,
             value: page.backgroundPage.id
        });
        this.colorButton.style.color = page.backgroundPage.backgroundColor;
    }

    if (!page.backgroundPageId && !page.backgroundColor) {
        this.backgroundCombo.selectItem({
            displayName: "Transparent Background",
            value: "transparent"
        });
        this.colorButton.style.color = "#000";
        this.colorButton.disabled = true;
    }
}

const SIZE_RE = /^([0-9]+)x([0-9]+)$/;

PageDetailDialog.prototype.createPage = function () {
    var name = this.pageTitle.value;

    var width = 0;
    var height = 0;
    var pageSize = this.pageSizeCombo.getSelectedItem();
    if (pageSize.value) {
        var size = pageSize.value;
        if (size.match(SIZE_RE)) {
            width = parseInt(RegExp.$1, 10);
            height = parseInt(RegExp.$2, 10);
        }
    } else {
        width = parseInt(this.widthInput.value, 10);
        height = parseInt(this.heightInput.value, 10);
    }

    var backgroundPageId = null;
    var backgroundColor = null;

    var background = this.backgroundCombo.getSelectedItem();
    if (background.value != "transparent") {
        if (typeof(background.value) == "undefined") {
            backgroundColor = this.colorButton.style.color ? this.colorButton.style.color : "#FFFFFF";
        } else {
            backgroundPageId = background.value;
        }
    }

    var page = Pencil.controller.newPage(name, width, height, backgroundPageId, backgroundColor, "", this.pageCombo.getSelectedItem().id);

    Config.set("lastSize", [width, height].join("x"));
    return page;
};

PageDetailDialog.prototype.updatePage = function() {
    var page = this.defaultPage;
    var pageIndex = Pencil.controller.doc.pages.indexOf(page);
    var oldPage = page.parentPage;

    page.name = this.pageTitle.value;

    var canvas = page.canvas;
    canvas.setSize(parseInt(this.widthInput.value, 10), parseInt(this.heightInput.value, 10));
    page.width = parseInt(this.widthInput.value, 10);
    page.height = parseInt(this.heightInput.value, 10);
    Config.set("lastSize", [page.width, page.height].join("x"));

    var thiz = this;
    var background = thiz.backgroundCombo.getSelectedItem();

    if (background.value != "transparent") {
        if (typeof(background.value) == "undefined") {
            page.backgroundColor = this.colorButton.style.color ? this.colorButton.style.color : "#FFFFFF";
            canvas.setBackgroundColor(page.backgroundColor);
        } else {
            page.backgroundPageId = background.value;
            page.backgroundPage = Pencil.controller.findPageById(background.value);
            canvas.setBackgroundColor(page.backgroundPage.backgroundColor);
        }
    } else if (background.value == "transparent") {
        if (page.backgroundPageId) {
            page.backgroundPage = null;
            page.backgroundPageId = null;
        }
            page.backgroundColor = null;
            canvas.setBackgroundColor(page.backgroundColor);
    }

    var parentPageId = this.pageCombo.getSelectedItem().id;
    if (parentPageId) {
        var sameParent = false;
        if (page.parentPage) {
            if (page.parentPage.id != parentPageId) {
                var index = page.parentPage.children.indexOf(page);
                page.parentPage.children.splice(index, 1);
            } else {
                 sameParent = true;
            }
        }
        if (!sameParent) {
            var parentPage = Pencil.controller.findPageById(parentPageId);
            if (!parentPage.children) parentPage.children = [];
            parentPage.children.push(page);
            page.parentPage = parentPage;
            page.parentPageId = parentPageId;
        }
    } else {
        if (page.parentPage) {
            var index = page.parentPage.children.indexOf(page);
            page.parentPage.children.splice(index, 1);
            page.parentPage = null;
            page.parentPageId = null;
        }
    }

    if (page.parentPage != oldPage) {
        Pencil.controller.doc.pages.splice(pageIndex,1);
        Pencil.controller.doc.pages.push(page);
    }
    Pencil.controller.sayDocumentChanged();
    return page;
}
PageDetailDialog.prototype.getDialogActions = function () {
    var thiz = this;

    return [
        {   type: "cancel", title: "Cancel",
            run: function () {
                if(this.modified) {
                    if(this.pageTitle.value == "" ) {
                        Dialog.alert("Page name is not declared","The name Page is not allow to empty");
                        return;
                    }
                    Dialog.confirm(
                        "If you don't save changes will be permanently lost", null,
                        "Save", function () {
                            if (thiz.onDone) {
                                if (thiz.defaultPage) {
                                    thiz.onDone(thiz.updatePage());
                                } else {
                                    thiz.onDone(thiz.createPage());
                                }
                            }
                        },
                        "Cancel"
                    );
                }
                return true;
            }
        },
        {
            type: "accept", title: "APPLY",
            run: function () {
                if(this.modified) {
                    if(this.pageTitle.value == "" ) {
                        Dialog.alert("Page name is not declared","The name Page is not allow to empty");
                        return;
                    }
                    if (thiz.onDone) {
                      if (thiz.defaultPage) {
                          thiz.onDone(thiz.updatePage());
                      } else {
                          thiz.onDone(thiz.createPage());
                      }
                    }
                }
                return true;
            }
        }
    ];
};
