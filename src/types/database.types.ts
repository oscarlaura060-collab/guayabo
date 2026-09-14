export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apartados: {
        Row: {
          abonado: number
          activo: boolean
          cantidad: number
          cliente_id: string | null
          cliente_nombre: string | null
          codigo: string | null
          color: string | null
          costo: number
          created_at: string
          disponible: boolean
          estado: string
          fecha: string | null
          fecha_limite: string | null
          id: string
          legacy_id: string | null
          observaciones: string | null
          precio: number
          prenda_id: string | null
          prenda_nombre: string | null
          saldo: number
          talla: string | null
          total: number
        }
        Insert: {
          abonado?: number
          activo?: boolean
          cantidad?: number
          cliente_id?: string | null
          cliente_nombre?: string | null
          codigo?: string | null
          color?: string | null
          costo?: number
          created_at?: string
          disponible?: boolean
          estado?: string
          fecha?: string | null
          fecha_limite?: string | null
          id?: string
          legacy_id?: string | null
          observaciones?: string | null
          precio?: number
          prenda_id?: string | null
          prenda_nombre?: string | null
          saldo?: number
          talla?: string | null
          total?: number
        }
        Update: {
          abonado?: number
          activo?: boolean
          cantidad?: number
          cliente_id?: string | null
          cliente_nombre?: string | null
          codigo?: string | null
          color?: string | null
          costo?: number
          created_at?: string
          disponible?: boolean
          estado?: string
          fecha?: string | null
          fecha_limite?: string | null
          id?: string
          legacy_id?: string | null
          observaciones?: string | null
          precio?: number
          prenda_id?: string | null
          prenda_nombre?: string | null
          saldo?: number
          talla?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "apartados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartados_prenda_id_fkey"
            columns: ["prenda_id"]
            isOneToOne: false
            referencedRelation: "prendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartados_prenda_id_fkey"
            columns: ["prenda_id"]
            isOneToOne: false
            referencedRelation: "top_prendas"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_personalizados: {
        Row: {
          activo: boolean
          clave: string | null
          etiqueta: string | null
          id: string
          modulo: string | null
          opciones: string | null
          orden: number
          requerido: boolean
          tipo: string | null
        }
        Insert: {
          activo?: boolean
          clave?: string | null
          etiqueta?: string | null
          id?: string
          modulo?: string | null
          opciones?: string | null
          orden?: number
          requerido?: boolean
          tipo?: string | null
        }
        Update: {
          activo?: boolean
          clave?: string | null
          etiqueta?: string | null
          id?: string
          modulo?: string | null
          opciones?: string | null
          orden?: number
          requerido?: boolean
          tipo?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          ciudad: string | null
          codigo: string | null
          created_at: string
          direccion: string | null
          documento: string | null
          email: string | null
          extra: Json
          id: string
          legacy_id: string | null
          nombre: string
          observaciones: string | null
          telefono: string | null
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          documento?: string | null
          email?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          nombre: string
          observaciones?: string | null
          telefono?: string | null
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          documento?: string | null
          email?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      config: {
        Row: {
          activo: boolean
          clave: string
          descripcion: string | null
          grupo: string | null
          tipo: string | null
          updated_at: string
          valor: string
        }
        Insert: {
          activo?: boolean
          clave: string
          descripcion?: string | null
          grupo?: string | null
          tipo?: string | null
          updated_at?: string
          valor?: string
        }
        Update: {
          activo?: boolean
          clave?: string
          descripcion?: string | null
          grupo?: string | null
          tipo?: string | null
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      consecutivos: {
        Row: {
          digitos: number
          entidad: string
          prefijo: string
          siguiente: number
        }
        Insert: {
          digitos?: number
          entidad: string
          prefijo: string
          siguiente?: number
        }
        Update: {
          digitos?: number
          entidad?: string
          prefijo?: string
          siguiente?: number
        }
        Relationships: []
      }
      gastos: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo: string | null
          comprobante_path: string | null
          comprobantes: string[]
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          legacy_id: string | null
          metodo: string | null
          observaciones: string | null
          valor: number
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo?: string | null
          comprobante_path?: string | null
          comprobantes?: string[]
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          legacy_id?: string | null
          metodo?: string | null
          observaciones?: string | null
          valor?: number
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo?: string | null
          comprobante_path?: string | null
          comprobantes?: string[]
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          legacy_id?: string | null
          metodo?: string | null
          observaciones?: string | null
          valor?: number
        }
        Relationships: []
      }
      listas: {
        Row: {
          activo: boolean
          ambito: string | null
          es_final: boolean
          hex: string | null
          id: string
          nombre: string
          orden: number
          tipo: string
        }
        Insert: {
          activo?: boolean
          ambito?: string | null
          es_final?: boolean
          hex?: string | null
          id?: string
          nombre: string
          orden?: number
          tipo: string
        }
        Update: {
          activo?: boolean
          ambito?: string | null
          es_final?: boolean
          hex?: string | null
          id?: string
          nombre?: string
          orden?: number
          tipo?: string
        }
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          nota: string | null
          prenda_id: string | null
          prenda_nombre: string | null
          referencia: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
          usuario_email: string | null
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          nota?: string | null
          prenda_id?: string | null
          prenda_nombre?: string | null
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: string
          usuario_email?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          nota?: string | null
          prenda_id?: string | null
          prenda_nombre?: string | null
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: string
          usuario_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_prenda_id_fkey"
            columns: ["prenda_id"]
            isOneToOne: false
            referencedRelation: "prendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_prenda_id_fkey"
            columns: ["prenda_id"]
            isOneToOne: false
            referencedRelation: "top_prendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          activo: boolean
          apartado_id: string | null
          cliente_id: string | null
          cliente_nombre: string | null
          codigo: string | null
          comprobante_path: string | null
          comprobantes: string[]
          created_at: string
          fecha: string
          id: string
          legacy_id: string | null
          metodo: string | null
          observaciones: string | null
          pedido_id: string | null
          tipo_pago: string | null
          valor: number
        }
        Insert: {
          activo?: boolean
          apartado_id?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          codigo?: string | null
          comprobante_path?: string | null
          comprobantes?: string[]
          created_at?: string
          fecha?: string
          id?: string
          legacy_id?: string | null
          metodo?: string | null
          observaciones?: string | null
          pedido_id?: string | null
          tipo_pago?: string | null
          valor?: number
        }
        Update: {
          activo?: boolean
          apartado_id?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          codigo?: string | null
          comprobante_path?: string | null
          comprobantes?: string[]
          created_at?: string
          fecha?: string
          id?: string
          legacy_id?: string | null
          metodo?: string | null
          observaciones?: string | null
          pedido_id?: string | null
          tipo_pago?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagos_apartado_id_fkey"
            columns: ["apartado_id"]
            isOneToOne: false
            referencedRelation: "apartados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          color: string | null
          costo_total: number
          costo_unit: number
          descuento: number
          id: string
          nombre: string | null
          pedido_id: string
          precio: number
          prenda_id: string | null
          talla: string | null
          total: number
          utilidad: number
        }
        Insert: {
          cantidad?: number
          color?: string | null
          costo_total?: number
          costo_unit?: number
          descuento?: number
          id?: string
          nombre?: string | null
          pedido_id: string
          precio?: number
          prenda_id?: string | null
          talla?: string | null
          total?: number
          utilidad?: number
        }
        Update: {
          cantidad?: number
          color?: string | null
          costo_total?: number
          costo_unit?: number
          descuento?: number
          id?: string
          nombre?: string | null
          pedido_id?: string
          precio?: number
          prenda_id?: string | null
          talla?: string | null
          total?: number
          utilidad?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_prenda_id_fkey"
            columns: ["prenda_id"]
            isOneToOne: false
            referencedRelation: "prendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_prenda_id_fkey"
            columns: ["prenda_id"]
            isOneToOne: false
            referencedRelation: "top_prendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          activo: boolean
          canal: string | null
          cliente_id: string | null
          cliente_nombre: string | null
          costo: number
          created_at: string
          descuento: number
          envio: number
          est_pago: string
          estado: string
          extra: Json
          fecha: string
          fecha_entrega: string | null
          fecha_envio: string | null
          guia: string | null
          id: string
          legacy_id: string | null
          notificado_envio: boolean
          numero: string | null
          observaciones: string | null
          pagado: number
          saldo: number
          subtotal: number
          tipo: string
          total: number
          transportadora: string | null
          url_rastreo: string | null
          utilidad: number
        }
        Insert: {
          activo?: boolean
          canal?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          costo?: number
          created_at?: string
          descuento?: number
          envio?: number
          est_pago?: string
          estado?: string
          extra?: Json
          fecha?: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          guia?: string | null
          id?: string
          legacy_id?: string | null
          notificado_envio?: boolean
          numero?: string | null
          observaciones?: string | null
          pagado?: number
          saldo?: number
          subtotal?: number
          tipo?: string
          total?: number
          transportadora?: string | null
          url_rastreo?: string | null
          utilidad?: number
        }
        Update: {
          activo?: boolean
          canal?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          costo?: number
          created_at?: string
          descuento?: number
          envio?: number
          est_pago?: string
          estado?: string
          extra?: Json
          fecha?: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          guia?: string | null
          id?: string
          legacy_id?: string | null
          notificado_envio?: boolean
          numero?: string | null
          observaciones?: string | null
          pagado?: number
          saldo?: number
          subtotal?: number
          tipo?: string
          total?: number
          transportadora?: string | null
          url_rastreo?: string | null
          utilidad?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string | null
          rol: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id: string
          nombre?: string | null
          rol?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          rol?: string
        }
        Relationships: []
      }
      prendas: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo: string | null
          color: string | null
          costo: number
          costos: Json
          created_at: string
          descripcion: string | null
          destacado: boolean
          extra: Json
          id: string
          imagen_path: string | null
          legacy_id: string | null
          nombre: string
          observaciones: string | null
          precio: number
          stock: number
          stock_minimo: number
          talla: string | null
          vendidas: number
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo?: string | null
          color?: string | null
          costo?: number
          costos?: Json
          created_at?: string
          descripcion?: string | null
          destacado?: boolean
          extra?: Json
          id?: string
          imagen_path?: string | null
          legacy_id?: string | null
          nombre: string
          observaciones?: string | null
          precio?: number
          stock?: number
          stock_minimo?: number
          talla?: string | null
          vendidas?: number
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo?: string | null
          color?: string | null
          costo?: number
          costos?: Json
          created_at?: string
          descripcion?: string | null
          destacado?: boolean
          extra?: Json
          id?: string
          imagen_path?: string | null
          legacy_id?: string | null
          nombre?: string
          observaciones?: string | null
          precio?: number
          stock?: number
          stock_minimo?: number
          talla?: string | null
          vendidas?: number
        }
        Relationships: []
      }
      solicitudes_web: {
        Row: {
          cedula: string | null
          ciudad: string | null
          cliente_nombre: string | null
          codigo: string | null
          created_at: string
          direccion: string | null
          email: string | null
          estado: string
          id: string
          items: Json
          notas: string | null
          telefono: string | null
          total: number
        }
        Insert: {
          cedula?: string | null
          ciudad?: string | null
          cliente_nombre?: string | null
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string
          id?: string
          items?: Json
          notas?: string | null
          telefono?: string | null
          total?: number
        }
        Update: {
          cedula?: string | null
          ciudad?: string | null
          cliente_nombre?: string | null
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string
          id?: string
          items?: Json
          notas?: string | null
          telefono?: string | null
          total?: number
        }
        Relationships: []
      }
    }
    Views: {
      apartados_activos_publico: {
        Row: {
          prenda_id: string | null
          reservado: number | null
        }
        Relationships: []
      }
      catalogo_publico: {
        Row: {
          categoria: string | null
          color: string | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          extra: Json | null
          id: string | null
          imagen_path: string | null
          nombre: string | null
          precio: number | null
          stock: number | null
          stock_minimo: number | null
          talla: string | null
          vendidas: number | null
        }
        Relationships: []
      }
      top_prendas: {
        Row: {
          categoria: string | null
          color: string | null
          id: string | null
          nombre: string | null
          talla: string | null
          unidades: number | null
          utilidad: number | null
          ventas: number | null
        }
        Relationships: []
      }
      ventas_por_dia: {
        Row: {
          costo: number | null
          fecha: string | null
          pedidos: number | null
          por_cobrar: number | null
          recibido: number | null
          utilidad: number | null
          ventas: number | null
        }
        Relationships: []
      }
      ventas_por_mes: {
        Row: {
          costo: number | null
          mes: string | null
          pedidos: number | null
          por_cobrar: number | null
          recibido: number | null
          utilidad: number | null
          ventas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      crear_venta: {
        Args: { p_items: Json; p_pago?: Json; p_pedido: Json }
        Returns: string
      }
      es_admin: { Args: never; Returns: boolean }
      perfil_activo: { Args: never; Returns: boolean }
      puede_escribir: { Args: never; Returns: boolean }
      recalcular_pago_pedido: { Args: { p_pedido: string }; Returns: undefined }
      rol_actual: { Args: never; Returns: string }
      siguiente_consecutivo: { Args: { p_entidad: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
