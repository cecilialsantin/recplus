"""Nueva actualización

Revision ID: 6d1eda6170a2
Revises: 0ad76e8e2f94
Create Date: 2025-02-19 16:58:07.458877

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6d1eda6170a2'
down_revision = '0ad76e8e2f94'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('recepcion_productos',
    sa.Column('recepcion_id', sa.Integer(), nullable=False),
    sa.Column('producto_codigo', sa.String(length=20), nullable=False),
    sa.ForeignKeyConstraint(['producto_codigo'], ['productos.codigo'], ),
    sa.ForeignKeyConstraint(['recepcion_id'], ['recepciones.id'], ),
    sa.PrimaryKeyConstraint('recepcion_id', 'producto_codigo')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('recepcion_productos')
    # ### end Alembic commands ###
