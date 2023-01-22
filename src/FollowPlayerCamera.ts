import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { Player } from "./CharacterController";

export class FollowPlayerCamera {
    private _scene: Scene;
    private _player: Player;

    // Camera rig: 
    private _camera: UniversalCamera;
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;
    
    // Camera settings: 
    private static readonly FOV: number = Math.PI / 6;
    private static readonly Y_OFFSET: number = 4;
    private static readonly Z_OFFSET: number = -35;
    private static readonly CAMERA_DELAY: number = .9;
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0, 0, 0);
    private static readonly MOVEMENT_THRESHOLD: number = 0.005;

    constructor(scene: Scene, player: Player) {
        this._scene = scene;
        this._player = player;

        this._camRoot = new TransformNode("camRoot", scene);
        this._yTilt = new TransformNode("yTilt", scene);
        this._camera = new UniversalCamera("cameraGame", new Vector3(0, 0, FollowPlayerCamera.Z_OFFSET), scene);

        this.setupCameraRig();
    }

    private setupCameraRig(): void {  
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);

        this._yTilt.rotation = FollowPlayerCamera.ORIGINAL_TILT;
        this._yTilt.parent = this._camRoot;

        this._camera.lockedTarget = this._camRoot.position;
        this._camera.fov = FollowPlayerCamera.FOV;
        this._camera.parent = this._yTilt;

        this._scene.activeCamera = this._camera;
    }

    public registerCameraUpdate(): void {
        this._scene.registerBeforeRender(() => {
            this.updateCameraPositionPF();       
        });
    }

    private updateCameraPositionPF(): void {
        let centerPlayer = this._player.mesh.position.y + FollowPlayerCamera.Y_OFFSET;

        let x = this._camRoot.position.x - this._player.mesh.position.x;
        let xSquared = x * x;
        let y = this._camRoot.position.y - centerPlayer;
        let ySquared = y * y;
        
        let distanceSquared = xSquared + ySquared;
        //let distance = Math.sqrt(distanceSquared);
        let scalingFactor = 1;

        // Disgusting formula i came up with: 
        let lerpFactor = (1 - FollowPlayerCamera.CAMERA_DELAY) * (1 - (1 / (distanceSquared + 1))) * scalingFactor;
        
        if(lerpFactor > FollowPlayerCamera.MOVEMENT_THRESHOLD) {
            this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this._player.mesh.position.x, centerPlayer, this._player.mesh.position.z), lerpFactor);
        }
        
        // this._camRoot.position.x = Scalar.Lerp(this._camRoot.position.x, this._player.mesh.position.x, 1 - FollowPlayerCamera.CAMERA_DELAY);
        // this._camRoot.position.y = Scalar.Lerp(this._camRoot.position.y, centerPlayer, 1 - FollowPlayerCamera.CAMERA_DELAY);
        // this._camRoot.position.z = Scalar.Lerp(this._camRoot.position.z, this._player.mesh.position.z, 1 - FollowPlayerCamera.CAMERA_DELAY);
    }

    public get camera(): UniversalCamera {
        return this._camera;
    }
}
