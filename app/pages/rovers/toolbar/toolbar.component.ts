import { Component, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "cosmos-rovers-toolbar",
    moduleId: module.id,
    templateUrl: "./toolbar.component.html",
    styleUrls: ["./toolbar.component.css"]
})
export class RoversToolbarComponent {
    @Output()
    notify: EventEmitter<string> = new EventEmitter<string>();

    onSaveFile() {
        this.notify.emit("onSaveFile");
    }

    onShare() {
        this.notify.emit("onShare");
    }

    onSetWallpaper() {
        this.notify.emit("onSetWallpaper");
    }
}
