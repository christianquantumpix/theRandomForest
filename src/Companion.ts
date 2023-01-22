import { Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Player } from "./CharacterController";

/**
 * Class for a companion that will follow the player around. 
 */
export class Companion {
    private scene: Scene;
    private mesh: Mesh;
    private player: Player;
    private offset: Vector3;

    private followPlayerFunction: () => void;

    /**
     * Creates a a companion that will follow the player around. 
     */
    constructor(scene: Scene, mesh: Mesh, player: Player, offset?: Vector3) {
        this.scene = scene;
        this.mesh = mesh;
        this.player = player;
        this.offset = offset || Vector3.Zero();

        this.followPlayerFunction = () => {

            let vectorToPlayer = this.player.mesh.position.add(this.offset).subtract(this.mesh.position);
            let distanceToPlayer = vectorToPlayer.length();

            if(distanceToPlayer > 2) {
                this.mesh.position.addInPlace(vectorToPlayer.scale(0.01));
            } 
        }
    }

    public registerFollowFunction(): void {
        this.scene.registerBeforeRender(this.followPlayerFunction);
    }

    /**
     * Unregisters the follow function from the render loop. 
     */
    public unregisterFollowFunction(): void {
        this.scene.unregisterBeforeRender(this.followPlayerFunction);
    }

    /**
     * Registers a function to the render loop that will make the companion follow the player around. 
     */
    public followPlayer(): void {
        this.scene.registerBeforeRender(this.followPlayerFunction);
    }

    /**
     * Disposes of the comapnion. 
     */
    public dispose(): void {
        this.scene.unregisterBeforeRender(this.followPlayerFunction);
        this.mesh.dispose();
    }
}
