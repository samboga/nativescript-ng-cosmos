import { ActivityIndicator } from "tns-core-modules/ui/activity-indicator";
import { View } from "tns-core-modules/ui/core/view";
import { alert, confirm, ConfirmOptions } from "tns-core-modules/ui/dialogs";
import { Image } from "tns-core-modules/ui/image";
import { Page } from "tns-core-modules/ui/page";
import { isAndroid } from "tns-core-modules/platform";
import { ScrollView } from "tns-core-modules/ui/scroll-view";
import { ApodItem } from "../../models/apod-model";
import { ApodService } from "../../services/apod.service";
import { ToolbarHelper } from "../../shared/toolbar-helper";
import { Component } from "@angular/core";

@Component({
    selector: "cosmos-items",
    moduleId: module.id,
    templateUrl: "./apod.component.html",
    styleUrls: ["./apod.component.css"]
})
export class ApodComponent {
    item: ApodItem = new ApodItem("", "", "", "", "", "", "", "");
    lastLoadedDate: Date = new Date(); // today

    /*
    [direction: boolean]
    true === means going to Prevous date;
    false === means going to Next date
        initial value set to true so when an YouTube Is loaded for INITIAL date
        to set prveious day with (result.media_type !== "image" && this.direction)
        Remove when logic for other media types is implemented!!!
    */
    direction: boolean = true;
    indicator: ActivityIndicator;
    image: Image;
    dock: View;
    scroll: ScrollView;

    constructor(
        private _apodService: ApodService,
        private _page: Page,
        private _toolbarHelper: ToolbarHelper
    ) {
        if (isAndroid) {
            this._page.actionBarHidden = true;
        }

        this.initData(); // initially load TODAY's pic
    }

    onDockLoaded(args) {
        this.dock = <View>args.object;
        // this.dock.translateY = 60;
        this.dock.translateY = 100;
        this.dock.translateX = 50;
        if (isAndroid) {
            this.dock.animate({
                translate: { x: 0, y: -10 },
                duration: 1000
            });
        } else {
            this.dock.animate({
                translate: { x: 0, y: 20 },
                duration: 1000
            });
        }
    }

    onImageLoaded(args) {
        this.image = <Image>args.object;

        // on App resume check if image is already loaded or not
        this.image.visibility = !this.image.isLoading ? "visible" : "collapse";

        this.image.on("isLoadingChange", params => {
            this.scroll.scrollToHorizontalOffset(0, true);
            this.scroll.scrollToVerticalOffset(0, true);

            if (!this.image.isLoading) {
                this.image.visibility = "visible"; // show image - change indicator
                this.indicator.busy = false;
                this.indicator.visibility = "collapse";
            } else {
                this.image.visibility = "collapse";
                this.indicator.busy = true;
                this.indicator.visibility = "visible";
            }
        });
    }

    onScrollLoaded(args) {
        this.scroll = <ScrollView>args.object;
    }

    onIndicatorLoaded(args) {
        this.indicator = args.object;
    }

    onNotify(message: string): void {
        if (message === "goToPrevousDay") {
            this.setPreviousDate();
        } else if (message === "goToNextDay") {
            this.setNextDate();
        } else if (message === "onShare") {
            this._toolbarHelper.onShare(this.item);
        } else if (message === "onSetWallpaper") {
            let options: ConfirmOptions = {
                // title: this.item.title,
                message: "Set as Wallpaper?",
                okButtonText: "Yes",
                cancelButtonText: "No",
                neutralButtonText: "Cancel"
            };
            confirm(options).then((result: boolean) => {
                // result can be true/false/undefined
                if (result) {
                    this._toolbarHelper.onSetWallpaper(this.item.url);
                } else {
                    return;
                }
            });
        } else if (message === "onSaveFile") {
            let options: ConfirmOptions = {
                title: "Image Downloaded!",
                message: "Saved in /Pictures/CosmosDatabank",
                okButtonText: "OK"
            };
            alert(options).then(() => {
                this._toolbarHelper.onSaveFile(this.item);
            });
        }
    }

    private setPreviousDate() {
        this.direction = true;
        this._toolbarHelper.setPrevousDay(this.lastLoadedDate);
        this.extractData(this._toolbarHelper.dateToString(this.lastLoadedDate));
    }

    private setNextDate() {
        this.direction = false;
        let isValideDate = this._toolbarHelper.setNextDay(this.lastLoadedDate);

        if (isValideDate && this.lastLoadedDate <= new Date()) {
            this.extractData(
                this._toolbarHelper.dateToString(this.lastLoadedDate)
            );
        } else {
            let options = {
                title: "No Photo Available!",
                message: "Future date requested - returning to today's pic.",
                okButtonText: "OK"
            };
            // show warnig if the user request photos from future date - disable the next button here
            alert(options).then(() => {
                this.lastLoadedDate = new Date();
                this.extractData(
                    this._toolbarHelper.dateToString(this.lastLoadedDate)
                );
            });
        }
    }

    private initData() {
        this._apodService.getData().subscribe(
            result => {
                if (result["media_type"] === "image") {
                    this.item = new ApodItem(
                        result["copyright"],
                        result["date"],
                        result["explanation"],
                        result["hdurl"],
                        result["media_type"],
                        result["service_version"],
                        result["title"],
                        result["url"]
                    );

                    this.lastLoadedDate = new Date(result["date"]);
                } else if (result["media_type"] !== "image" && this.direction) {
                    // TODO: implement the logic for YouTube videos here
                    this.lastLoadedDate = new Date(result["date"]);
                    this._toolbarHelper.setPrevousDay(this.lastLoadedDate);
                    this.extractData(
                        this._toolbarHelper.dateToString(this.lastLoadedDate)
                    );
                } else if (
                    result["media_type"] !== "image" &&
                    !this.direction
                ) {
                    // TODO: implement the logic for YouTube videos here
                    this.lastLoadedDate = new Date(result["date"]);
                    let isValideDate = this._toolbarHelper.setNextDay(
                        this.lastLoadedDate
                    );
                    if (isValideDate) {
                        this.extractData(
                            this._toolbarHelper.dateToString(
                                this.lastLoadedDate
                            )
                        );
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            },
            error => {
                console.log("Server Status Code: " + error.status);
            }
        );
    }

    private extractData(date: string) {
        this._apodService.getDataWithCustomDate(date).subscribe(
            result => {
                if (result["media_type"] === "image") {
                    this.item = new ApodItem(
                        result["copyright"],
                        result["date"],
                        result["explanation"],
                        result["hdurl"],
                        result["media_type"],
                        result["service_version"],
                        result["title"],
                        result["url"]
                    );

                    this.scroll.scrollToHorizontalOffset(0, true);
                } else if (result["media_type"] !== "image" && this.direction) {
                    // TODO: implement the logic for YouTube videos here
                    this._toolbarHelper.setPrevousDay(this.lastLoadedDate);
                    this.extractData(
                        this._toolbarHelper.dateToString(this.lastLoadedDate)
                    );
                } else if (
                    result["media_type"] !== "image" &&
                    !this.direction
                ) {
                    // TODO: implement the logic for YouTube videos here
                    let isValideDate = this._toolbarHelper.setNextDay(
                        this.lastLoadedDate
                    );
                    if (isValideDate) {
                        this.extractData(
                            this._toolbarHelper.dateToString(
                                this.lastLoadedDate
                            )
                        );
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            },
            error => {
                console.log("Server Status Code: " + error.status);
            }
        );
    }
}
