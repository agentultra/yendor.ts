/*
	Section: Scheduler.
*/
module Yendor {
	"use strict";

	/*
		Interface: TimedEntity
		Something that must be updated every once in a while
	*/
	export interface TimedEntity {
		/*
			Function: update
			Update the entity and set its new waitTime.
			Any call to update MUST increase waitTime to keep the creature from locking the scheduler.
		*/
		update();

		/*
			Property: waitTime
			Time until the next update() call. This represents the number of times 
			<Scheduler.run()> must be called before this entity is updated again.
		*/
		waitTime: number;
	}
	/*
		Class: Scheduler
		Handles timed entities and the order in which they are updated
	*/
	export class Scheduler {
		private entities: BinaryHeap<TimedEntity>;
		private paused: boolean = false;

		constructor() {
			this.entities = new BinaryHeap<TimedEntity>((entity: TimedEntity) => {
				return entity.waitTime;
			});
		}

		add(entity: TimedEntity) {
			this.entities.push(entity);
		}

		addAll(entities: TimedEntity[]) {
			this.entities.pushAll(entities);
		}

		remove(entity: TimedEntity) {
			this.entities.remove(entity);
		}
		clear() {
			this.entities.clear();
		}

		pause() {
			this.paused = true;
		}
		resume() {
			this.paused = false;
		}
		isPaused() {
			return this.paused;
		}
		run() {
			if ( this.paused || this.entities.isEmpty() ) {
				return;
			}
			// decrease all entities' wait time
			var elapsed = this.entities.peek().waitTime;
			if ( elapsed > 0 ) {
				for (var i: number = 0, len: number = this.entities.size(); i < len; ++i) {
					this.entities.peek(i).waitTime -= elapsed;
				}
			}
			// update all entities with wait time <= 0
			var updatedEntities: TimedEntity[] = [];
			var entity: TimedEntity = this.entities.peek();
			while ( entity && entity.waitTime <= 0 ) {
				updatedEntities.push(entity);
				this.entities.pop();
				var oldWaitTime = entity.waitTime;
				entity.update();
				if ( entity.waitTime <= oldWaitTime ) {
					// enforce waitTime to avoid deadlock
					entity.waitTime = oldWaitTime + 1;
				}
				entity = this.entities.peek();
			}
			// push updated entities back to the heap
			this.entities.pushAll(updatedEntities);
		}
	}
}
