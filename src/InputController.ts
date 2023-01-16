import { Scene, ActionManager, ExecuteCodeAction, Scalar } from "@babylonjs/core";

export class PlayerInput {
    public scene: Scene;

    public inputMap: any;
    public jumpKeyDown: boolean = false;

    // this should all happpen in the player class
    public direction: number = 0;
    public velocity: number = 0;
    private static readonly ACCELERATION = .5;

    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.actionManager = new ActionManager(this.scene);

        this.inputMap = {};

        this.scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        this.scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        this.scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    //this should happen in the player class. 
    private _updateFromKeyboard(): void {
        if (this.inputMap["a"] || this.inputMap["ArrowLeft"]) {
            this.velocity = Scalar.Lerp(this.velocity, 1, PlayerInput.ACCELERATION);
            this.direction = 1;
    
        } else if (this.inputMap["d"] || this.inputMap["ArrowRight"]) {
            this.velocity = Scalar.Lerp(this.velocity, 1, PlayerInput.ACCELERATION);
            this.direction = -1;
        }
        else {
            this.velocity = 0;
            this.direction = 0;
        }

        if (this.inputMap["w"] ||this.inputMap[" "]) {
            this.jumpKeyDown = true;
        } else {
            this.jumpKeyDown = false;
        }
    }
}
