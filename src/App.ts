import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder, Scene, UniversalCamera } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";

import { Environment } from "./Environment";
import { Player } from "./CharacterController";
import { FollowPlayerCamera } from "./FollowPlayerCamera";
import { PlayerInput } from "./InputController";

import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Companion } from "./Companion";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

/**
 * Handles the game logic. 
 */
export class App {
    private _state: State = State.START;

    private _scene: Scene; // _scene attribute the different scenes will be attached to. 

    private _sceneStart: Scene;
    private _sceneCutScene: Scene;
    private _sceneGame: Scene;
    private _sceneLose: Scene;

    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    //Camera stuff
    private _followPositionCamera: FollowPlayerCamera;

    private _player: Player;

    private _environment: any;

    /**
     * Creates a new app instance. 
     */
    constructor() {
        this._canvas = this._createCanvas();
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        console.time('dummy_scenes');
        this._sceneGame = new Scene(this._engine);
        this._sceneStart = new Scene(this._engine);
        this._sceneCutScene = new Scene(this._engine);
        this._sceneLose = new Scene(this._engine);
        console.timeEnd('dummy_scenes');

        let playerInput = new PlayerInput(this._sceneGame); //detect keyboard/mobile inputs
        this._player = new Player(this._sceneGame, playerInput);
        this._followPositionCamera = new FollowPlayerCamera(this._sceneGame, this._player);

        this._scene.activeCamera = new UniversalCamera("throwawaycam", new Vector3());
        this._sceneGame.activeCamera = this._followPositionCamera.camera;

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        this._main();
    }

    /**
     * Creates a new HTML canvas element to render the scene on. 
     * 
     * @returns The canvas element. 
     */
    private _createCanvas(): HTMLCanvasElement {
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        // this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }

    /**
     * Runs the render loop and adds a handler for canvas resizing. 
     */
    private async _main(): Promise<void> {
        await this._goToStart();

        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    private async _goToStart(): Promise<void> {
        // ToDo
        this._goToCutScene();
    }

    private async _goToCutScene(): Promise<void> {
        //ToDo
        this._goToGame();
    }

    private async _goToGame(): Promise<void> {
        //--SETUP SCENE--
        this._scene.detachControl();

        //--GUI--
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        //dont detect any inputs from this ui while the game is loading
        this._sceneGame.detachControl();

        //create a simple button
        const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
        loseBtn.width = 0.2
        loseBtn.height = "40px";
        loseBtn.color = "white";
        loseBtn.top = "-14px";
        loseBtn.thickness = 0;
        loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        playerUI.addControl(loseBtn);

        //this handles interactions with the start button attached to the scene
        loseBtn.onPointerDownObservable.add(() => {
            this._goToLose();
            this._sceneGame.detachControl(); //observables disabled
        });

        //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
        var finishedLoading = false;
        await this._setUpGame().then(res => {
            finishedLoading = true;
        });

        //primitive character and setting
        await this._initializeGameAsync(this._sceneGame);

        //--WHEN SCENE FINISHED LOADING--
        await this._sceneGame.whenReadyAsync();
        let outer = this._sceneGame.getMeshByName("outer");
        if (outer) {
            outer.position = new Vector3(0, 3, 0);
        }

        this._state = State.GAME;

        this._scene = this._sceneGame;

        this._engine.hideLoadingUI();
        //the game is ready, attach control back
        this._scene.attachControl();

        this._followPositionCamera.registerCameraUpdate();
    }

    private async _goToLose(): Promise<void> {
        //ToDo
        this._goToStart();
    }

    private async _setUpGame() {
        //--CREATE ENVIRONMENT--
        const environment = new Environment(this._sceneGame);
        this._environment = environment;

        let garbagefck = await this._player.loadCharacter(this._sceneGame); //environment
        let fck = await this._environment.load().then(
            () => {
                this._player.setupSuccessEvent(this._environment.successTriggers);
                this._player.setupFailureEvent(this._environment.failureTriggers);
                console.log(this._environment.successTriggers.length);
            }
        );

        let companionMesh = MeshBuilder.CreateSphere("companion", {}, this._sceneGame);
        let companion = new Companion(this._sceneGame, companionMesh, this._player, new Vector3(0, 1, 0));
        companion.followPlayer();

        window.setTimeout(() => {
            companion.dispose();
        }, 150000);
    }

    private async _initializeGameAsync(scene: Scene): Promise<void> {
        //temporary light to light the entire scene
        // var light0 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
        // const light = new PointLight("sparklight", new Vector3(0, 4, -4), scene);
        // light.diffuse = new Color3(1, 1, 1);
        // light.intensity = 100;
        // light.radius = 1;

        // Activate the movemnt of stuff
        this._player.activateTracking();
    }
}
