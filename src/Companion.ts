import { Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Player } from "./CharacterController";

/**
 * Class for a companion that will follow the player around. 
 */
export class Companion {
    private _scene: Scene;
    private _mesh: Mesh;
    private _player: Player;
    private _offset: Vector3;

    private FOLLOW_DELAY: number = .9;
    private MOVEMENT_THRESHOLD: number = 0.005;

    private followPlayerFunctionPF: () => void;

    /**
     * Creates a a companion that will follow the player around. 
     */
    constructor(scene: Scene, mesh: Mesh, player: Player, offset?: Vector3) {
        this._scene = scene;
        this._mesh = mesh;
        this._player = player;
        this._offset = offset || Vector3.Zero();

        this.followPlayerFunctionPF = () => {

            let vectorToPlayer = this._player.mesh.position.add(this._offset).subtract(this._mesh.position);

            let distanceSquared = vectorToPlayer.lengthSquared();

            // let distanceToPlayer = vectorToPlayer.length();

            let scalingFactor = 1;
            let lerpFactor = (1 - this.FOLLOW_DELAY) * (1 - (1 / (distanceSquared + 1))) * scalingFactor;

            // if(distanceToPlayer > 2) {
            //     this._mesh.position.addInPlace(vectorToPlayer.scale(0.01));
            // }

            // Suboptimally creates a new Vector3 Object. 
            if (lerpFactor > this.MOVEMENT_THRESHOLD) {
                this._mesh.position = Vector3.Lerp(this._mesh.position, this._player.mesh.position, lerpFactor);
            }
        }
    }

    /**
     * Registers the follow function to the render loop. 
     */
    public registerFollowFunction(): void {
        this._scene.registerBeforeRender(this.followPlayerFunctionPF);
    }

    /**
     * Unregisters the follow function from the render loop. 
     */
    public unregisterFollowFunction(): void {
        this._scene.unregisterBeforeRender(this.followPlayerFunctionPF);
    }

    /**
     * Registers a function to the render loop that will make the companion follow the player around. 
     */
    public followPlayer(): void {
        this._scene.registerBeforeRender(this.followPlayerFunctionPF);
    }

    /**
     * Disposes of the comapnion. 
     */
    public dispose(): void {
        this._scene.unregisterBeforeRender(this.followPlayerFunctionPF);
        this._mesh.dispose();
    }
}
