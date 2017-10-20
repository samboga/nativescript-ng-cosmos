
import { Page } from "ui/page";
import { isAndroid } from "platform";
import { Component, ChangeDetectionStrategy } from "@angular/core";

import { RoverPhoto } from "../../models/rover-model";
import { RoverPhotosService } from "../../services/rover.service";

import { Observable as RxObservable } from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/operator/do";

@Component({
    selector: "rovers",
    moduleId: module.id,
    templateUrl: "./rovers.component.html",
    styleUrls: ["./rovers.component.css"]
})
export class RoversComponent {

    public roverPhotos: RxObservable<Array<RoverPhoto>>;
    public isAndroid: boolean;

    private tempArr: Array<RoverPhoto> = [];
    private pageIndex: number;
    private subscr;

    constructor(private roverService: RoverPhotosService, private page: Page) {
        this.page.actionBarHidden = true;

        this.pageIndex = 1;
        this.extractData("2017-06-21", this.pageIndex);

        this.isAndroid = isAndroid;
    }

    private extractData(date: string, pageIndex: number) {

        // this.roverService.getPhotosWithDateAndPageIndex(pageIndex)
        //     .subscribe((itemsList) => {
        //         this.roverPhotos = itemsList;
        //     }, (error) => {
        //         console.log(error);
        //     });

        this.roverService.getPhotosWithDateAndPageIndex(pageIndex)
            .subscribe((itemsList) => {
                this.tempArr = itemsList;

                this.roverPhotos = RxObservable.create(subscriber => {
                    this.subscr = subscriber;
                    subscriber.next(this.tempArr);
                });
            }, (error) => {
                console.log(error);
            });
    }

    onLoadMoreItemsRequested(args) {
        this.roverService.getPhotosWithDateAndPageIndex(++this.pageIndex)
            .subscribe((itemsList) => {
                itemsList.forEach(element => {
                    this.tempArr.push(element);
                });

                this.subscr.next(this.tempArr);
            })
    }
}