import { TransformNode, Scene, Mesh, Vector3, Quaternion, Ray, AbstractMesh, MeshBuilder, Matrix, SceneLoader, ActionManager, ExecuteCodeAction } from "@babylonjs/core";
import { PlayerInput } from "./InputController";
import { COLLISIONBOX_VISIBILITY, GRAVITY, JUMP_FORCE, PLAYER_SPEED, ROTATION_SPEED } from "./settings";

/**
 * Class that handles a playable character. 
 */
export class Player extends TransformNode {
    private _playerInput;

    // Player
    private _mesh: Mesh; //outer collisionbox of player

    //player movement vars
    private _deltaTime: number;
    private _velocity: number;
    private _moveDirection: Vector3;

    //gravity, ground detection, jumping
    private _gravity: Vector3;
    private _lastGroundPos: Vector3; // keep track of the last grounded position
    //private _grounded: boolean;
    private _jumpCount: number;

    /**
     * Creates a new playble character. 
     * 
     * @param scene Scene object the playable character will be put in to. 
     * @param playerInput Player input object receiving and storing data from an input device. 
     */
    constructor(scene: Scene, playerInput: PlayerInput) {
        super("player", scene);
        this._scene = scene;

        this._mesh = this.createPlayerCollisionBox();

        this._mesh.parent = this;
        this._playerInput = playerInput;

        this._deltaTime = 0;
        this._velocity = 0;

        this._moveDirection = Vector3.Zero();
        this._gravity = Vector3.Zero();
        this._lastGroundPos = Vector3.Zero();

        this._jumpCount = 1;
    }

    /**
     * Creates a collision box that acts as a placeholder for the actual player geometry, before it is fully loaded. 
     * 
     * @returns Collision box. 
     */
    private createPlayerCollisionBox(): Mesh {
        let collisionBox = MeshBuilder.CreateBox("playerCollisionBox", { width: 1, depth: 1, height: 1 }, this._scene);
        collisionBox.visibility = COLLISIONBOX_VISIBILITY;
        collisionBox.isPickable = false; // Otherwise raycast hits itself.
        collisionBox.checkCollisions = true;

        //move origin of box collider to the bottom of the mesh (to match player mesh)
        collisionBox.bakeTransformIntoVertices(Matrix.Translation(0, .5, 0))

        //for collisions
        // outer.ellipsoid = new Vector3(1, 1.5, 1);
        // outer.ellipsoidOffset = new Vector3(0, 1.5, 0);
        collisionBox.rotationQuaternion = new Quaternion(0, 0, 0, 0); // rotate the player mesh 180 since we want to see the back of the player
        return collisionBox;
    }

    /**
     * Updates the players position and rotation according to the input data. 
     */
    private updateFromControlsPF(): void {
        this._deltaTime = this._scene.getEngine().getDeltaTime() / 1000.0;

        this._velocity = this._playerInput.velocity; //x-axis
        this._moveDirection = new Vector3(this._velocity * this._playerInput.direction, 0, 0);
        this._moveDirection = this._moveDirection.scaleInPlace(this._velocity * PLAYER_SPEED);

        //Rotations
        if (this._playerInput.direction == 0) {//if there's no input detected, prevent rotation and keep player in same rotation
            return;
        }

        //rotation based on input & the camera angle
        let angle = Math.atan2(this._playerInput.direction, 0); // !Not the same as atan (y/x). 
        angle -= Math.PI;
        let targ = Quaternion.FromEulerAngles(0, -angle, 0);
        if(this._mesh.rotationQuaternion) {
            this._mesh.rotationQuaternion = Quaternion.Slerp(this._mesh.rotationQuaternion, targ, ROTATION_SPEED * this._deltaTime);
        }
    }

    /**
     * Function for casting a ray downwards to check for ground intersections. 
     * 
     * @param offsetx X- axis offset from the player for the ray origin. 
     * @param offsetz Z- axis offset from the player for the ray origin. 
     * @param raycastlen Length of the casted ray. 
     * @returns The point the raycaster registerd an intersection at. Zero otherwise. 
     */
    private floorRaycastPF(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
        let raycastFloorPos = new Vector3(this._mesh.position.x + offsetx, this._mesh.position.y + 0.5, this._mesh.position.z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

        let predicate = function (mesh: AbstractMesh) {
            return mesh.isPickable && mesh.isEnabled();
        }
        let pick = this._scene.pickWithRay(ray, predicate);

        if(!pick) {
            return Vector3.Zero();
        }
        if(!pick.hit) {
            return Vector3.Zero();
        }
        if(pick.pickedPoint) {
            //console.log(pick!.pickedPoint);
            return pick.pickedPoint;
            
        }
        return Vector3.Zero();
    }

    /**
     * Checks if the player is standing on ground. 
     * 
     * @returns Custom object holding data about a possible intersection with the ground. 
     */
    private isGroundedPF(): any{
        let floorRaycast = this.floorRaycastPF(0, 0, 0.6);
        if (floorRaycast.equals(Vector3.Zero())) {
            return {isGrounded: false, atPosition: floorRaycast};
        } else {
            return {isGrounded: true, atPosition: floorRaycast};
        }
    }

    /**
     * Updates the ground detection. 
     */
    private updateGroundDetectionPF(): void {
        let isGrounded = this.isGroundedPF();

        if (!isGrounded.isGrounded) {
            this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * GRAVITY));
        } else {
            this._mesh.position = isGrounded.atPosition; // Snapping the player to the position the ray detected the ground at. 
            this._lastGroundPos.copyFrom(this._mesh.position);
            
            this._gravity.y = 0;
            this._jumpCount = 1; // Allow for jumping. 
        }

        // Limit the speed of gravity to the negative of the jump power. 
        if (this._gravity.y < -JUMP_FORCE) {
            this._gravity.y = -JUMP_FORCE;
        }

        // Jump detection: 
        if (this._playerInput.jumpKeyDown && this._jumpCount > 0) {
            this._gravity.y = JUMP_FORCE;
            this._jumpCount--;
        }

        this._mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));
    }

    /**
     * Starts the tracking of the player inputs and checking for ground- collisions. 
     */
    public activateTracking(): void {
        this._scene.registerBeforeRender(() => {
            this.updateFromControlsPF();
            this.updateGroundDetectionPF();
        })
    }

    /**
     * The player mesh. 
     */
    public get mesh(): Mesh {
        return this._mesh;
    }

    /**
     * The player mesh. 
     */
    public set mesh(mesh: Mesh) {
        this._mesh = mesh;
    }

    /**
     * Loads meshes that represent the player character and attaches them to the scene. 
     * 
     * @param scene Scene object the player character will be loaded in to. 
     */
    async loadCharacter(scene: Scene): Promise<void> {
        SceneLoader.ImportMeshAsync(null, "./assets/models/", "cat.glb", scene).then((result) =>{
            const root = result.meshes[0];

            let collisionMesh;

            root.getChildMeshes().forEach(mesh => {
                mesh.isPickable = false;

                if(!mesh.name.includes("collision")) {
                    mesh.checkCollisions = false;
                    return;
                }
                mesh.visibility = COLLISIONBOX_VISIBILITY;
                //console.log(mesh.name);
                collisionMesh = mesh;
            });

            root.parent = this._mesh;
            this._mesh.checkCollisions = false; // Dirty hack: Disable old collisionBox collisions instead of replacing. 
        });
    }

    /**
     * Switches the old collision box for a new one. 
     * 
     * @param collisionBoxNew Collision box to switch in. 
     */
    public switchCollisionBox(collisionBoxNew: Mesh) {
        let children = this._mesh.getChildren();

        for(let child of children) {
            child.parent = collisionBoxNew;
        }

        //this._mesh.dispose();
        this._mesh = collisionBoxNew; 
    }

    /**
     * Sets up a success event. 
     * 
     * @param triggers Objects that triffer a success event on intersection with the player. 
     */
    public setupSuccessEvent(triggers: Array<Mesh>) {

        for(let trigger of triggers) {

            trigger.visibility = COLLISIONBOX_VISIBILITY;

            this._mesh.actionManager = this._mesh.actionManager || new ActionManager();
            this._mesh.actionManager.registerAction(
                new ExecuteCodeAction({
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: trigger},
                    () => {
                        window.alert("you win");
                    }
                )
            );
        }
    }

    /**
     * Sets up a failure event. 
     * 
     * @param triggers Objects that triffer a success event on intersection with the player. 
     */
    public setupFailureEvent(triggers: Array<Mesh>) {
        
        for(let trigger of triggers) {

            trigger.visibility = COLLISIONBOX_VISIBILITY;

            this._mesh.actionManager = this._mesh.actionManager || new ActionManager();
            this._mesh.actionManager.registerAction(
                new ExecuteCodeAction({
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: trigger},
                    () => {
                        window.alert("you loose");
                    }
                )
            );
        }
    }
}
