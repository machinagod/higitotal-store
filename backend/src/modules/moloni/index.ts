import { Module } from "@medusajs/framework/utils"
import MoloniModuleService from "./service"

export const MOLONI_MODULE = "moloni"

export default Module(MOLONI_MODULE, {
  service: MoloniModuleService,
})

export { default as MoloniModuleService } from "./service"
export * from "./types"
